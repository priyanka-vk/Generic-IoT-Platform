/***************************************************************************************************
Project Name : SmartPlug
Authors      : Priyanka Kurkure
               Anjali Dhabaria
               Nikitha Kondapalli
               Anuj Khare 
Mentor       : Manas Das
Organisation : Indian Institute of Technology,Bombay
Description  : This project helps us to control an appliance plugged into the SmartPlug
               using an application or from dashboard using WiFi connectivity.
***************************************************************************************************/
#include <SimpleTimer.h>
#include <ESP8266WiFi.h>                                                              //https://github.com/esp8266/Arduino
#include <DNSServer.h>                                                                //https://github.com/esp8266/Arduino/tree/master/libraries/DNSServer
#include <ESP8266WebServer.h>                                                         //https://github.com/esp8266/Arduino/tree/master/libraries/ESP8266WebServer
#include <WiFiManager.h>                                                              //https://github.com/tzapu/WiFiManager
#include <PubSubClient.h>                                                             //https://github.com/knolleary/pubsubclient
#include <Ticker.h>                                                                   //https://github.com/esp8266/Arduino/tree/master/libraries/Ticker

WiFiClient espClient;
PubSubClient client(espClient);
WiFiManager wifiManager;
SimpleTimer timer;                                                                    //https://github.com/jfturcot/SimpleTimer
Ticker ticker;

int private_key=23;                                                                   // Update these with values according to your setup.
const char* mqtt_server = "192.168.43.198";                                           //"10.129.26.138" :ipv4 for RaspberryPi
int stateD3,stateD6,inten,inten_map,timerId,i;
char s;
long t,t_ms,j,t_s,previous=0;
char msg[50],msg1[50];
char* access;
String _inten;
int32_t zero;
float e=0,energy,x1,P;

/****************************************************************************************************
Function Name :   tick()
Description   :   flickers the Green LED(D1) while connecting and RED LED (D0) high when not connected
Parameters    :   None
Return        :   void
*****************************************************************************************************/
void tick()
{
  int state = digitalRead(D1);  
  digitalWrite(D1, !state);                                                           //toggle state 
}

/****************************************************************************************************
Function Name :   configModeCallback()
Description   :   gets called when WiFiManager enters configuration mode
Parameters    :   *myWiFiManager - pointer of the object of class WiFiManager
Return        :   void
*****************************************************************************************************/
void configModeCallback (WiFiManager *myWiFiManager)
{
  Serial.println("Entered config mode");
  Serial.println(WiFi.softAPIP());
  Serial.println(myWiFiManager->getConfigPortalSSID());                               //if you used auto generated SSID, print it
  ticker.attach(0.2, tick);                                                           //entered config mode, make led toggle faster
}

/***************************************************************************************************
Function Name :   callback()
Description   :   gets called when subscribed to a particular topic
Parameters    :   topic - character pointer to the topic subscribed , payload - Message 
                  received from the topic , length - length of the payload
Return        :   void
****************************************************************************************************/
void callback(char* topic, byte* payload, unsigned int length) 
{
  access = decryptMessage(payload,length);
  char m[length];
  for (int i = 0; i < length && access[i] != '\0'; i++)
  {
    m[i] = access[i];
  }
  if((String)topic =="59554083c05105108ec536e7/state")
    {
      s=m[0];
      if(s=='T')
        {
          inten=0;
          for(j=2;j<=4;j++)
            {
              _inten=_inten+m[j];
              int r=m[j]-'0';
              inten = inten*10+r;
            }
            _inten = _inten+'\0';
            inten_map=map(inten,0,100,0,1023);
            analogWrite(D7,inten_map);    
         }   
    }
  else if((String)topic=="59554083c05105108ec536e7/time")
  {
    if((char)m[0]=='K')
      {
        timer.deleteTimer(timerId);
      }
    else
      {
        inten=0;
        for(j=2;j<=4;j++)
          {
            int r=m[j]-'0';
            inten = inten*10+r;
          }  
        t_s=0;
        for(j=6;j<=length-1 && m[j] != '@';j++)
          {
            t= m[j]-'0';
            t_s = t_s*10+t;
          }  
        inten_map=map(inten,0,100,0,1023);
        analogWrite(D7,inten_map);
        if((char)m[0]=='T')
          {
          t_ms=t_s*1000;
          timerId = timer.setTimeout(t_ms,f_timer_high);
          }
        else if((char)m[0]=='F')
          {
            t_ms=t_s*1000;
            timerId = timer.setTimeout(t_ms,f_timer_low);
          }
        }
    }
  }

/**************************************************************************************************
Function Name :   f_timer_high()
Description   :   gets called in setTimeOut to turn ON the device after t_ms milliseconds
Parameters    :   None
Return        :   void
***************************************************************************************************/    
void f_timer_high()
{
  if(!digitalRead(D2))
  {
    digitalWrite(D5,HIGH);
    inten_map=map(inten,0,100,0,1023);
    analogWrite(D7,inten_map);                                                        // switch ON the appliance at given mapped intensity
    String str = "ON@"+String(inten);
    encryptMessage("59554083c05105108ec536e7/notify",str);                            // Publishes "device_state@intensity" to the dashboard as feedback
    stateD3=digitalRead(D3);
    digitalWrite(D3,!stateD3);
    stateD6=digitalRead(D6);
    digitalWrite(D6,!stateD6);
  }
  else
  {
    String str = "AO@"+String(inten);
    encryptMessage("59554083c05105108ec536e7/notify",str);                            // Publishes "device_state@intensity" to the dashboard as feedback
  }
   
}

/**************************************************************************************************
Function Name :   f_timer_low()
Description   :   gets called in setTimeOut to turn OFF the device after t_ms milliseconds
Parameters    :   None
Return        :   void
**************************************************************************************************/  
void f_timer_low()
{ 
  if(digitalRead(D2))
  {
    digitalWrite(D5,LOW);
    encryptMessage("59554083c05105108ec536e7/notify","OF@0");                         // Publishes "device_state@intensity" to the dashboard as feedback
    stateD3=digitalRead(D3);
    digitalWrite(D3,!stateD3);
    stateD6=digitalRead(D6);
    digitalWrite(D6,!stateD6);
      
   }
   else{
      encryptMessage("59554083c05105108ec536e7/notify","AF@0");                       // Publishes "device_state@intensity" to the dashboard as feedback
    }
   
}

/*************************************************************************************************
Function Name :   reconnect()
Description   :   connects to MQTT Broker to Publish and Subscribe messages to a Topic.
Parameters    :   None
Return        :   void
**************************************************************************************************/ 
void reconnect() 
{
  int h=0;
  while (!client.connected()&& h<1)
  {
  Serial.print("Attempting MQTT connection...");
  if (client.connect("ESP8266ClientA"))
  {
    Serial.println("connected");
    encryptMessage("59554083c05105108ec536e7/notify","CN@");
    client.subscribe("59554083c05105108ec536e7/state");
    client.subscribe("59554083c05105108ec536e7/time");
  }
  else
  {
    Serial.print("failed, rc=");
    Serial.print(client.state());
    Serial.println(" try again in 5 seconds");
    // Wait 5 seconds before retrying
    delay(1000);
    h++;
  }
  }
}

/*************************************************************************************************
Function Name :   encryptMessage()
Description   :   Encrypts the messages being published for application layer security
Parameters    :   topic - the topic to which message is to be published
                  msg   - message to be published to the topic
Return        :   void
**************************************************************************************************/
void encryptMessage( char* topic, String msg)
{ 
  int i,j; 
  unsigned int x = msg.length()+1;
  char store[x],enc_Msg[x],enc_priv_key[4],message[50];
  msg.toCharArray(store,x);
  int rand_key=random(1,36);                                                       // range from 1 to 165 for UPPER CASE ALPHABETICAL MESSAGE, range from 1 to 198 for NUMERICAL MESSAGE.
  for(i=0; i < x ; i++)
    { 
      enc_Msg[i] = store[i] + rand_key;                                           //encrypts the message to be published using randomly generated key.
    }
  enc_Msg[i] = '\0';
  String pub_key = String(rand_key);
  for(i=0;i<pub_key.length();i++)
  {
    enc_priv_key[i]=pub_key[i]+private_key;                                      //encrypts the randomly generated key to publish it on a topic.(for decrypting the message at other side)
  }
  enc_priv_key[i] = '\0';
  String _key = String(enc_priv_key);
  String _msg = String(enc_Msg);
  String _message = _key +"/"+ _msg;                                             //concatenating encrypted random key and encrypted message
  _message.toCharArray(message,50);                                              
  char * msg_ptr = message;
  client.publish(topic,msg_ptr);
 } 

/***************************************************************************************************
Function Name :   decryptMessage()
Description   :   Decrypts the encrypted message for running application
Parameters    :   rec    - payload received from the subscribed topic
                  length - length of the received payloas
Return        :   char*  - pointer to the decrypted message array
***************************************************************************************************/  
char* decryptMessage(byte* rec , unsigned int length)
{
  char pub_key[2],store[x],dec_Msg[x-2];
  unsigned int x = length;
  int i,j,int_key=0;
  for(i=0;i<2 && (char)rec[i] != '/' ;i++)
  {
    pub_key[i]=(char)rec[i]- private_key;                                       // decrypting the random key using private key
    int_key=int_key*10+(pub_key[i]-'0');
  }
  i++;
  j=0;
  for( ; i < x  ;i++,j++)
  {
    dec_Msg[j]=(char)rec[i]-int_key;                                            //decrypting the message using the random key decryptes previously
  }
  dec_Msg[j]='\0';
  char* load = dec_Msg; 
  return load ; 
}


void setup()
{
  Serial.begin(9600);
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
  
  pinMode(D1, OUTPUT);                                                          //to show connecting to wifi 
  pinMode(D0, INPUT);                                                           //to show not connected to wifi
  pinMode(D2, INPUT);                                                           //to read status from SPDT
  pinMode(D5, OUTPUT);                                                          //SSR
  pinMode(D3,OUTPUT);                                                           // pin1 of SPDT
  pinMode(D6,OUTPUT);                                                           // pin3 of SPDT
  pinMode(D7,OUTPUT);                                                           // for intensity regulation

  digitalWrite(D3,LOW);                                                         // initially LOW for the device to remain in OFF state
  digitalWrite(D6,HIGH); 
  digitalWrite(D5,LOW);
 
  ticker.attach(0.6, tick) ;                                                    // start ticker with 0.5 because we start in AP mode and try to connect

  wifiManager.setAPCallback(configModeCallback);                                //set callback that gets called when connecting to previous WiFi fails,
                                                                                //and enters Access Point mode
  if (!wifiManager.autoConnect("SmartPlug")) 
    {
      Serial.println("failed to connect and hit timeout");                      //fetches ssid and pass and tries to connect.
                                                                                //If it does not connect it starts an access point with the specified name here "AutoConnectAP"
                                                                                //and goes into a blocking loop awaiting configuration
      //reset and try again, or maybe put it to deep sleep
      digitalWrite(D1,LOW);
      delay(2000);
      ESP.reset();
      delay(1000);
    }
  //if you get here you have connected to the WiFi
  Serial.println("connected...yeey :)");
  ticker.detach();
  digitalWrite(D1, LOW);
  delay(2000);
  digitalWrite(D1, HIGH);
}

/***************************************************************************************************
Function Name :   power()
Description   :   Calculates the energy consumed by the device every 2 seconds
Parameters    :   None
Return        :   void
***************************************************************************************************/  
void power()
{
  zero=0;
  for(i=0;i<10;i++)
  {
    zero=zero+analogRead(A0);
    delay(10);
  }
  zero=zero/10;
  float V = 220;
  uint32_t period = 1000000 / 50,t_start = micros(),Isum = 0, measurements_count = 0;
  int32_t Inow;
  if(digitalRead(D2 )==HIGH)
  {
    while (micros() - t_start < period) 
    {
      Inow = zero-analogRead(A0);
      Isum += Inow*Inow;
      measurements_count++;
    }
    float Irms = sqrt(Isum / measurements_count) / 1023 * 3.3 / 0.185;                                // To measure current we need to know the frequency of current
    P = V * Irms;                                                                                     // By default 50Hz is used, but you can specify own, if necessary 
    long now=millis();                                                                                // To calculate the power we need voltage multiplied by current
    if(now-previous >=2000)
    {
      previous=now;
      x1= 2.0/3600.0;
      e= e+ P*x1;
      energy =e/1000.0;
    }
    dtostrf(energy,6,6,msg1);                                                                         // converts float value 'énergy' into a string and stores in msg1 array.
    encryptMessage("59554083c05105108ec536e7/energy",msg1);
   }
}

/********************************************************************************************
Function Name :   loop()
Description   :   executed in a loop. Here the loop involves manual switching and switching 
                  from dashboard.
Parameters    :   None
Return        :   void
*********************************************************************************************/  
void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  power();

/*******************************************************************************************  
 Checking Continuously if Wifi disconnected and turning LED off if true  
 *******************************************************************************************/
  if(WiFi.status() != WL_CONNECTED)                                                                 
    {
      digitalWrite(D1,LOW);
    }
  else
    {
      digitalWrite(D1,HIGH);
     }

 /*******************************************************************************************  
 If D1 is low => Wifi Disconnected => autoconnecting if true  
 *******************************************************************************************/
  if(!digitalRead(D1))
    {
      ticker.attach(0.6,tick);
      if (!wifiManager.autoConnect("SmartPlug"))
      {
        Serial.println("failed to connect and hit timeout");
        delay(1000); 
      }
      Serial.println("connected...yeey :)");
      ticker.detach();
      digitalWrite(D1, HIGH);
    }

 /*******************************************************************************************  
 Checking continuously when push button is pressed and autoconnecting   
 *******************************************************************************************/
  if(digitalRead(D0)==LOW)
  {
    ticker.attach(0.2,tick);
    wifiManager.resetSettings();
    wifiManager.setAPCallback(configModeCallback);
    if (!wifiManager.autoConnect("SmartPlug"))
    {
      Serial.println("failed to connect and hit timeout");
      delay(1000); 
    }
    Serial.println("connected...yeey :)");
    ticker.detach();
    digitalWrite(D1, HIGH);
  }

/*******************************************************************************************  
Getting status if WiFi and mqtt connections are established  
*******************************************************************************************/
  int internet = digitalRead(D1);
  int mState   = client.state();

  timer.run(); 

/*******************************************************************************************  
Actions according to subscribed values and manual ON/OFF
*******************************************************************************************/
  if(internet==1 && mState==0)
  {
      if(s =='T')
      {
        if(!digitalRead(D5))
        {
          analogWrite(D7,inten_map);
          digitalWrite(D5,HIGH);
          stateD3=digitalRead(D3);
          digitalWrite(D3,!stateD3);
          stateD6=digitalRead(D6);
          digitalWrite(D6,!stateD6);  
          String str = "ON@"+String(inten);
          encryptMessage("59554083c05105108ec536e7/notify",str);
        }   
        else
        {
          String str = "AO@"+String(inten);
          encryptMessage("59554083c05105108ec536e7/notify",str);
        }
        s='\0';   
      }
        
      else if(s=='F')
      {
        if(digitalRead(D2))
          {
            stateD3=digitalRead(D3);
            digitalWrite(D3,!stateD3);
            stateD6=digitalRead(D6);
            digitalWrite(D6,!stateD6);
            digitalWrite(D5,LOW);
            encryptMessage("59554083c05105108ec536e7/notify","OF@0"); 
          } 
        else
          {
            encryptMessage("59554083c05105108ec536e7/notify","AF@0");
          }
        s='\0'; 
      }
      else
      {
        if(digitalRead(D2))
          {
            digitalWrite(D5,HIGH);
            analogWrite(D7,inten_map);
          } 
        else
          {
            digitalWrite(D5,LOW); 
          }      
       }
  }

  else
    {
      if(digitalRead(D2))
        {
          analogWrite(D7,inten_map);
          digitalWrite(D5,HIGH);
        } 
      else
        {
          digitalWrite(D5,LOW);  
        }
    }

}

