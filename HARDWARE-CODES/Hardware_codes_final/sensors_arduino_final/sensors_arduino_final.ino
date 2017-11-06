/***************************************************************************************************
Project Name : Generic IoT Platform (Sensors-Arduino Communication)
Authors      : Priyanka Kurkure
               Anjali Dhabaria
               Nikitha Kondapalli
               Anuj Khare 
Mentor       : Manas Das
Organisation : Indian Institute of Technology,Bombay
Description  : This project helps us to collect and transmit data from sensors using an application
               or from dashboard using WiFi connectivity.
***************************************************************************************************/

#include <SoftwareSerial.h>
#include<DHT.h>

#define DHTPIN 6
#define DHTTYPE DHT11

SoftwareSerial serial(4,5);                                                       //Rx,Tx for software serial.
DHT dht(DHTPIN,DHTTYPE);                                                          // DHT11 constructor declaration
uint8_t temp, hum;
int inten,x,y,z;


/****************************************************************************************************
Function Name :   dht_11()
Description   :   Reads the temperature and humidity of surroundings using DHT11 sensor
Parameters    :   None
Return        :   void
*****************************************************************************************************/
void dht1()
{
  temp=dht.readTemperature();
  Serial.println(temp);
  hum = dht.readHumidity();
  Serial.println(hum);
}


/****************************************************************************************************
Function Name :   acc()
Description   :   Reads the acceleration along x,y,z axis using ADXL335 sensor
Parameters    :   None
Return        :   void
*****************************************************************************************************/
void acc()
{
  x=map(analogRead(A1),0,1024,0,255);
  Serial.println(x);
  y=map(analogRead(A2),0,1024,0,255);
  Serial.println(y);
  z=map(analogRead(A3),0,1024,0,255);
  Serial.println(z);
}


/****************************************************************************************************
Function Name :   intensity()
Description   :   Reads the light intensity of surroundings using light intensity sensor
Parameters    :   None
Return        :   void
*****************************************************************************************************/
void intensity()
{
  inten=map(analogRead(A0),0,1024,0,255);
  Serial.println(inten);
}


/****************************************************************************************************
Function Name :   writedata()
Description   :   Writes data to software serial
Parameters    :   None
Return        :   void
*****************************************************************************************************/
void writedata()
{
  serial.write(temp);
  serial.write(hum);
  serial.write(inten);
  serial.write(x);
  serial.write(y);
  serial.write(z);
}


void setup()
{
  Serial.begin(9600);
  serial.begin(9600);
  dht.begin();
  delay(100);
  pinMode(A0,INPUT);
  pinMode(A1,INPUT);
  pinMode(A2,INPUT);
  pinMode(A3,INPUT);
}


void loop()
{
  dht1();
  intensity();
  acc();
  writedata();
}



