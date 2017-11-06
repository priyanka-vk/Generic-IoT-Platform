/***************************************************************************************************
Project Name : Generic IoT Project (ESP-Arduino Communication)
Authors      : Priyanka Kurkure
               Anjali Dhabaria
               Nikitha Kondapalli
               Anuj Khare 
Mentor       : Manas Das
Organisation : Indian Institute of Technology,Bombay
Description  : This project helps us to control a device by an application or from dashboard 
               using WiFi connectivity.
***************************************************************************************************/


#include <ESP8266WiFi.h>                                                          //https://github.com/esp8266/Arduino
#include <PubSubClient.h>                                                         //https://github.com/knolleary/pubsubclient
#include <DNSServer.h>                                                            //https://github.com/esp8266/Arduino/tree/master/libraries/DNSServer
#include <ESP8266WebServer.h>                                                     //https://github.com/esp8266/Arduino/tree/master/libraries/ESP8266WebServer
#include <WiFiManager.h>                                                          //https://github.com/tzapu/WiFiManager

const char* mqtt_server = "192.168.43.198" ;
int private_key = 23;
WiFiClient espClient;
PubSubClient client(espClient);

char msg[50];
char *access;
int x;

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
  Serial.println(myWiFiManager->getConfigPortalSSID());                        //if you used auto generated SSID, print it
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
   int rand_key=random(1,36);                                                  // range from 1 to 36 for UPPER CASE ALPHABETICAL MESSAGE, range from 1 to 62 for NUMERICAL MESSAGE.
  
     for(i=0; i < x ; i++)
     { 
       enc_Msg[i] = store[i] + rand_key;                                       //encrypts the message to be published using randomly generated key.
     }
     enc_Msg[i] = '\0';
     
    String pub_key = String(rand_key);
 
     for(i=0;i<pub_key.length();i++)
     {
       enc_priv_key[i]=pub_key[i]+private_key;                                 //encrypts the randomly generated key to publish it on a topic.(for decrypting the message at other side)
     }
     enc_priv_key[i] = '\0';
  
    String _key = String(enc_priv_key);
    String _msg = String(enc_Msg);
    String _message = _key +"/"+ _msg;                                         //concatenating encrypted random key and encrypted message
    _message.toCharArray(message,50); 
    char* msg_ptr = message;
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
  unsigned int x = length;
  char pub_key[2],dec_Msg[x-2];
  int i,j,int_key=0;
  
    for(i=0;i<2 && (char)rec[i] != '/' ;i++)
     {
       pub_key[i]=(char)rec[i]- private_key;                                    // decrypting the random key using private key
       int_key=int_key*10+(pub_key[i]-'0'); 
     }
  i++;
  j=0;
     for( ; i < x  ;i++,j++)
     {
       dec_Msg[j]=(char)rec[i]-int_key;                                         //decrypting the message using the random key decryptes previously
     }
    dec_Msg[j]='\0';
  char* load = dec_Msg; 
  return load ; 
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
      Serial.println(m[0]);
   if((String)topic == "5955445cc05105108ec53715/state")
 {   
   if(m[0] == 'T')
   {
    Serial.write(1);                                                      //Send "t" to Arduino to switch on the device connected
    Serial.println("bulb_on");
   }
   
   else
   {
    Serial.write(2);                                                     //Send "f" to Arduino to switch off the device connected
    Serial.println("bulb off");
   }
  }
  else if((String)topic == "59554466c05105108ec53717/state")
  {
     if(m[0] == 'T')
   {
    Serial.write(3);                                                      //Send "t" to Arduino to switch on the device connected
    Serial.println("motor on");
   }
   else
   {
    Serial.write(4);                                                     //Send "f" to Arduino to switch off the device connected
    Serial.println("motor off");
   }
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
  while (!client.connected()) 
  {
    Serial.print("Attempting MQTT connection...");
      if (client.connect("ESP8266Client_Relay"))                                //Client ID should be unique for different ESPs.
       {
         Serial.println("connected");
         encryptMessage("5955445cc05105108ec53715/notify","CN@");
         encryptMessage("59554466c05105108ec53717/notify","CN@");
         client.subscribe("5955445cc05105108ec53715/state");
         client.subscribe("59554466c05105108ec53717/state");
       }
     else 
       {
         Serial.print("failed, rc=");
         Serial.print(client.state());
         Serial.println(" try again in 5 seconds");
         delay(5000);                                                          // Wait 5 seconds before retrying
       }
   }
}


void setup() 
{
  Serial.begin(9600);
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
  
  /**WiFiManager**/
  
  WiFiManager wifiManager;                                                      //Local intialization. Once its business is done, there is no need to keep it around
  
  wifiManager.setAPCallback(configModeCallback);                                //set callback that gets called when connecting to previous WiFi fails, 
                                                                                //and enters Access Point mode
   if (!wifiManager.autoConnect())
   {                                                                            //fetches ssid and pass and tries to connect.
     Serial.println("failed to connect and hit timeout");                       //If it does not connect it starts an access point with the specified name here "AutoConnectAP"
                                                                                //and goes into a blocking loop awaiting configuration
    ESP.reset();                                                                //resets the ESP to reconnect to WiFi.
    delay(1000);        
   }

  Serial.println("Connected!");                                                 //if you get here you have connected to the WiFi
}

void loop()
{
     if (!client.connected())
      {
        reconnect();
      }
  client.loop();
}
