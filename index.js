const express = require("express");
const multer = require('multer');
const AWS = require('aws-sdk');


const app = express()

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// AWS S3 configuration
const s3 = new AWS.S3({ region: 'eu-west-2' });

app.post("/api/upload",upload.single('file'),  async(req,res)=>{
      // req.file is the `image` file
      // req.body will hold the text fields, if there were any

    console.log(req)

    const file = req.file;
    const key = `uploads/${file.originalname}`;


    if (!file) {
      return res.status(400).send('No file uploaded.');
    }


    try {
        // Upload the image to S3
        await s3.upload({
          Bucket: 'blurrybucket',
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype
        }).promise();
    
        // Generate a pre-signed URL for the Python server to process the image
        // const presignedUrl = s3.getSignedUrl('getObject', {
        //   Bucket: 'blurrybucket',
        //   Key: key,
        //   Expires: 3600
        // });

        // console.log(presignedUrl)

        /*
    
        // Send the pre-signed URL to the Python server for processing
        // Assuming the Python server is running at http://<EC2_INSTANCE_2_IP>:5000/process
        const response = await axios.post('http://<EC2_INSTANCE_2_IP>:5000/process', { url: presignedUrl });
    
        // Upload the processed image back to S3
        const processedKey = `processed/${file.originalname}`;
        await s3.upload({
            Bucket: 'blurrybucket',
            Key: processedKey,
            Body: response.data,
            ContentType: 'image/jpeg'
          }).promise();
      
          // Provide the processed image URL to the user
          const processedImageUrl = s3.getSignedUrl('getObject', {
            Bucket: 'blurrybucket',
            Key: processedKey,
            Expires: 3600
          });


          */
      
        // res.json({ imageUrl: processedImageUrl });
        } catch (error) {
          //res.status(500).send('Error processing image');

          return res.json({message:`api is working ${error}`})
        }




    
})


app.get("/api",(req,res)=>{
    console.log("new request ... ")
    return res.json({message:"api is working"})
})


app.listen(8027,()=>{
    console.log("server listening on por 8027")
})
