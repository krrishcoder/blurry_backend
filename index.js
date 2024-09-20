const express = require("express");
const multer = require('multer');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid'); 
const axios = require('axios');



const app = express()

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// AWS S3 configuration
const s3 = new AWS.S3({ region: 'eu-west-2' });

// In-memory storage to track task statuses
let taskStatuses = {};



app.get('/api/task-status/:taskId', (req, res) => {
  const taskId = req.params.taskId;
  const status = taskStatuses[taskId];

  if (status) {
    res.json({ status });
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});



app.get('/api/testflask',async (req,res)=>{

 
  try{
   const response = await axios.get('http://172.31.60.4:5000/process', {
    params: {
      url: "url checking"
    }
  });
  return res.json({messagefromflask: response})

}catch (error){
  if (error.response) {

    return res.json({messagefromflask: error})
  }else{
    return res.json({messagefromflask: error.message})
  }
}

});




app.post("/api/upload",upload.single('file'),  async(req,res)=>{
      // req.file is the `image` file
      // req.body will hold the text fields, if there were any

    console.log(req)

    const taskId = uuidv4();  // Generate a unique ID for the task
    taskStatuses[taskId] = 'in progress'; 

    const file = req.file;
    const key = `uploads/${file.originalname}`;



    if (!file) {
      return res.status(400).send('No file uploaded.');
    }


    try {
       

        await s3.upload({
          Bucket: 'blurrybucket',
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype
        }).promise();
    
        //Generate a pre-signed URL for the Python server to process the image
        const presignedUrl = s3.getSignedUrl('getObject', {
          Bucket: 'blurrybucket',
          Key: key,
          Expires: 3600
        });

        // console.log(presignedUrl)

       
    
        // Send the pre-signed URL to the Python server for processing
        // Assuming the Python server is running at http://<EC2_INSTANCE_2_IP>:5000/process
        const response = await axios.get('http://172.31.60.4:5000/process', {
          params: {
            url: presignedUrl
          }
        });

         /*
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
      
        res.json({ imageUrl: presignedUrl , key :key, task_id: taskId , responsefromflask : response });

        } catch (error) {
          //res.status(500).send('Error processing image');

          return res.json({message:`api is working ${error}`})
        }




    
})


app.get("/api",(req,res)=>{
    console.log("new request ... ")
    return res.json({message:"api is working"})
})


app.listen(8021,()=>{
    console.log("server listening on por 8027")
})
