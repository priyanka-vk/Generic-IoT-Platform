/***************************************************************************************************
Project Name : Generic IoT Platform(Arduino-Actuator Communication)
Authors      : Priyanka Kurkure
               Anjali Dhabaria
               Nikitha Kondapalli
               Anuj Khare 
Mentor       : Manas Das
Organisation : Indian Institute of Technology,Bombay
Description  : This project helps us to control a device by an application or from dashboard 
               using WiFi connectivity.
***************************************************************************************************/


#include <SoftwareSerial.h>
SoftwareSerial relay(4,5);                                                    //RX,TX for software serial


void setup()
{
  Serial.begin(9600);
  relay.begin(9600);
  pinMode(2,OUTPUT);                                  
  digitalWrite(2,HIGH);                                                      //Active LOW digital pins of Arduino CC
  pinMode(3,OUTPUT);
  digitalWrite(3,HIGH);
}


void loop()
 {
    while(relay.available())
      {
         int x = relay.read();
        if(x==1)
          {
            digitalWrite(2,LOW);                                             //Bulb ON when x=1
          }
       else if(x == 2)
          {
            digitalWrite(2,HIGH);                                            //Bulb OFF when x=2
          }
       else if(x==3)
          {
            digitalWrite(3,LOW);                                             //Motot ON when x=3
          }
       else if(x ==4)
         {
           digitalWrite(3,HIGH);                                             //Motor OFF when x=4  
         }
     } 
  }

