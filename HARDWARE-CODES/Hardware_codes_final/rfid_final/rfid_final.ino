/***************************************************************************************************
Project Name : RFID-Servomotor 
Authors      : Priyanka Kurkure
               Anjali Dhabaria
               Nikitha Kondapalli
               Anuj Khare 
Mentor       : Manas Das
Organisation : Indian Institute of Technology,Bombay
Description  : This project helps us to control the servomotor rotation using RFID reader.
***************************************************************************************************/


#include <SPI.h>            
#include <MFRC522.h>                                                      //https://github.com/miguelbalboa/rfid
#include <ESP8266WiFi.h>                                                  //https://github.com/esp8266/Arduino
#include <DNSServer.h>                                                    //https://github.com/esp8266/Arduino/tree/master/libraries/DNSServer
#include <ESP8266WebServer.h>                                             //https://github.com/esp8266/Arduino/tree/master/libraries/ESP8266WebServer
#include <WiFiManager.h>                                                  //https://github.com/tzapu/WiFiManager
#include <PubSubClient.h>                                                 //https://github.com/knolleary/pubsubclient
#include<Servo.h>

#define SS_PIN 15                                                         // SDA pin defined for RFID reader
#define RST_PIN 2                                                         // Reset pin defined for RFID reader

const char* mqtt_server = "192.168.43.198";                                // Update these with values suitable for your network.
int private_key = 23 ;

char msg[50];
char x;
int f1=0;

WiFiClient espClient;
PubSubClient client(espClient);
Servo myservo;                                                            // create servo ect to control a servo

MFRC522 rfid(SS_PIN, RST_PIN);                                            // Instance of the class

MFRC522::MIFARE_Key key; 

 
byte nuidPICC[4];                                                         // Init array that will store new NUID

byte knownTac[4] = {193,166,15,43};                                       //Card UID
                                                                          //byte knownTac[4] = {149,212,165,117};Key UID


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
  Serial.println(myWiFiManager->getConfigPortalSSID());                   //if you used auto generated SSID, print it;
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
      if (client.connect("ESP8266Client_RFID"))                         //Client ID must be unique for different ESPs
       {
         Serial.println("connected");
         encryptMessage("595546dac05105108ec53720/notify","CN@");
         client.subscribe("595546dac05105108ec53720/state");
         client.subscribe("595546dac05105108ec53720/time");
       }
     else 
       {
         Serial.print("failed, rc=");
         Serial.print(client.state());
         Serial.println(" try again in 5 seconds");
         delay(5000);                                                     // Wait 5 seconds before retrying
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
   int rand_key=random(1,36);                                             // range from 1 to 36 for UPPER CASE ALPHABETICAL MESSAGE, range from 1 to 62 for NUMERICAL MESSAGE.
  
     for(i=0; i < x ; i++)
     { 
       enc_Msg[i] = store[i] + rand_key;                                  //encrypts the message to be published using randomly generated key.
     }
     enc_Msg[i] = '\0';
     
    String pub_key = String(rand_key);
 
     for(i=0;i<pub_key.length();i++)
     {
       enc_priv_key[i]=pub_key[i]+private_key;                            //encrypts the randomly generated key to publish it on a topic.(for decrypting the message at other side)
     }
     enc_priv_key[i] = '\0';
  
    String _key = String(enc_priv_key);
    String _msg = String(enc_Msg);
    String _message = _key +"/"+ _msg;                                    //concatenating encrypted random key and encrypted message
    _message.toCharArray(message,50); 
    char * msg_ptr = message;
    client.publish(topic,msg_ptr);
} 


/*************************************************************************************************
Function Name :   printDec()
Description   :   prints the UID of the scanned card in decimal.
Parameters    :   buffer     - the byte array pointer which is to be converted to decimal
                  bufferSize - the size of array.
Return        :   void
**************************************************************************************************/
void printDec(byte *buffer, byte bufferSize) {
  for (byte i = 0; i < bufferSize; i++) {
    Serial.print(buffer[i] < 0x10 ? " 0" : " ");
    Serial.print(buffer[i], DEC);
  }
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


void setup() 
{ 
   Serial.begin(9600);
   client.setServer(mqtt_server, 1883);                                    
   client.setCallback(callback);                                           
   myservo.attach(D1);
   SPI.begin();                                                           // Initialize SPI bus
   
     /**WiFiManager**/
  
  WiFiManager wifiManager;                                                //Local intialization. Once its business is done, there is no need to keep it around
  
  wifiManager.setAPCallback(configModeCallback);                          //set callback that gets called when connecting to previous WiFi fails, 
                                                                          //and enters Access Point mode
     if (!wifiManager.autoConnect())
     {                                                                    //fetches ssid and pass and tries to connect.
       Serial.println("failed to connect and hit timeout");               //If it does not connect it starts an access point with the specified name here "AutoConnectAP"
                                                                          //and goes into a blocking loop awaiting configuration
      
       ESP.reset();                                                       //resets the ESP to reconnect to WiFi.
       delay(1000);        
      }

  
  Serial.println("Connected!");                                           //if you get here you have connected to the WiFi

  rfid.PCD_Init();                                                        // Init MFRC522 
}

 
void loop() 
{
     if (!client.connected()) 
      {
        reconnect();
      }
   client.loop();
  
    if ( ! rfid.PICC_IsNewCardPresent())                                  // Look for new cards
      return;

    if ( ! rfid.PICC_ReadCardSerial())                                    // Verify if the NUID has been readed
      return;
  
    for (byte i = 0; i < 4; i++) 
     {
       nuidPICC[i] = rfid.uid.uidByte[i];                                 // Store NUID into nuidPICC array
     }
     
   f1=0;
   Serial.println();
   Serial.print(F("In dec: "));
   printDec(rfid.uid.uidByte, rfid.uid.size);                             //prints the UID of the scanned tag in decimal
   Serial.println();

   for(int i = 0; i < 4; i++)
   {                     
      if (knownTac[i] == nuidPICC[i])
      {
        f1++;
      }
   }
   if(f1 == 4)
   {
    encryptMessage("595546dac05105108ec53720/notify","AU@");              //Authenticated User 
    delay(1000);
    myservo.write(180);
    delay(4000);
    myservo.write(0);
   }
  else
  {
   encryptMessage("595546dac05105108ec53720/notify","UU@");               //Unauthenticated User
   myservo.write(0);
  } 

 rfid.PICC_HaltA();                                                       // Halt PICC
 rfid.PCD_StopCrypto1();                                                  // Stop encryption on PCD
}









