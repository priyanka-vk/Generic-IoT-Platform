/***************************************************************************************************
Project Name : Generic IoT Platform (ESP-Arduino Communication)
Authors      : Priyanka Kurkure
               Anjali Dhabaria
               Nikitha Kondapalli
               Anuj Khare 
Mentor       : Manas Das
Organisation : Indian Institute of Technology,Bombay
Description  : This project helps us to collect and transmit data from sensors using an application
               or from dashboard using WiFi connectivity.
***************************************************************************************************/

#include <ESP8266WiFi.h>                                                          //https://github.com/esp8266/Arduino
#include <PubSubClient.h>                                                         //https://github.com/knolleary/pubsubclient
#include <DNSServer.h>                                                            //https://github.com/esp8266/Arduino/tree/master/libraries/DNSServer
#include <ESP8266WebServer.h>                                                     //https://github.com/esp8266/Arduino/tree/master/libraries/ESP8266WebServer
#include <WiFiManager.h>                                                          //https://github.com/tzapu/WiFiManager


const char* mqtt_server = "192.168.43.198" ;                                        //"10.129.26.138"; //rpi ipv4
int private_key = 23;                                                              // Update these with values suitable for your setup.

WiFiClient espClient;
PubSubClient client(espClient);

char msg[50];
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
   int rand_key=random(1,36);                                                  // range from 1 to 36.
  
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
Function Name :   callback()
Description   :   gets called when subscribed to a particular topic
Parameters    :   topic - character pointer to the topic subscribed , payload - Message 
                  received from the topic , length - length of the payload
Return        :   void
****************************************************************************************************/
void callback(char* topic, byte* payload, unsigned int length) 
{
   Serial.print("Message arrived [");
   Serial.print(topic);
   Serial.print("] ");
    for (int i = 0; i < length; i++)
    {
      Serial.print((char)payload[i]);
    }
   Serial.println();
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
      if (client.connect("ESP8266Client_sensor"))                             //Client ID should be unique for the ESPs to communicate using WiFi
       {
         Serial.println("connected");                                         //network connected
         encryptMessage("59553f9ec05105108ec536d9/notify","CN@"); 
         encryptMessage("59553fb9c05105108ec536db/notify","CN@");             // Sends message to each device when MQTT connection is made.
         encryptMessage("59553fcdc05105108ec536dd/notify","CN@"); 
         encryptMessage("59553ff0c05105108ec536df/notify","CN@"); 
         encryptMessage("59554003c05105108ec536e1/notify","CN@"); 
         encryptMessage("59554018c05105108ec536e3/notify","CN@");
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

int i=0;


void loop()
{
     if (!client.connected())
      {
        reconnect();
      }
  client.loop();
    while(Serial.available())
      {
        x=(Serial.read());
        snprintf (msg, 75, "%d",x);                                             //converts the integer values present in serial buffer and stores them into msg char array.
    
        if(i ==0)
          {
            encryptMessage("59553f9ec05105108ec536d9/values",msg);              //temperature values
          }
    
       else if(i == 1)
         {
           encryptMessage("59553fb9c05105108ec536db/values",msg);               //humidity values
         }
       else if(i == 2)
         {  
           encryptMessage("59553fcdc05105108ec536dd/values",msg);               //intensity values
         }
       else if(i == 3)
         {
          encryptMessage("59553ff0c05105108ec536df/values",msg);                //x_axis values
         }
       else if(i == 4)
        {
         encryptMessage("59554003c05105108ec536e1/values",msg);                 //y_axis values
        }
      else if(i == 5)
        {
         encryptMessage("59554018c05105108ec536e3/values",msg);                 //z_axis values
        }
       
    i = ((i+1)%6);
    delay(1000);
  }
}

