# AWS File Batch Uploader

A simple file upload system to handle large file batches (up to 20,000 files) with resumable uploads and real-time progress tracking. This application supports uploading files directly to AWS S3 using pre-signed URLs, improving performance and scalability.

## Features
- **Resumable Uploads**: Handle large file uploads by splitting them into chunks and resuming interrupted uploads.
- **Real-time Progress Tracking**: Monitor the status of your uploads with detailed progress updates.
- **S3 Integration**: Upload files directly to AWS S3 using pre-signed URLs.
- **Easy AWS Credential Upload**: Upload your AWS credentials to the application for seamless integration.
- **Drag-and-Drop Support**: Upload files easily by dragging them into the file uploader.
  
### Key Sections:
1. **Features**: Overview of the capabilities of your uploader.
2. **Prerequisites**: What the user needs (AWS account, AWS credentials, Node.js).
3. **Setup**: How to clone the repo, install dependencies, and run the app locally.
4. **Usage**: How to use the app once it's running.
5. **Technologies Used**: Technologies like React, AWS S3, and Tailwind CSS used in the project.
6. **License**: Information about the project license (you can change it if you're using a different one).
   
### Acknowledgments
- AWS S3 Documentation
- React
- Tailwind CSS
- golang

### Usage
File Upload
Click Upload Files or drag and drop files to start the upload process.
The application will automatically upload the files to S3 in chunks, and you can track the progress in real-time.
Batch Overview
Once files are uploaded, the Batch Overview will display a summary of the upload status, including the number of completed, failed, and total files.
Technologies Used
Frontend: React, Tailwind CSS
AWS: S3, Presigned URLs
Icons: Lucide React Icons

## Prerequisites
Before running the application, ensure you have the following:

- **AWS Account**: For S3 integration, you need an AWS account with access to an S3 bucket.
- **Node.js**: The frontend is built with React and needs Node.js to run.
- **AWS CLI or Access Keys**: To interact with AWS services, you need AWS credentials. You can upload them via the modal in the UI.

## Setup Vite.js Project

### 1. Clone the repository

git clone https://github.com/MadhusudanGhule/aws-file-batch-uploader.git
cd aws-file-batch-uploader

### 2. Install dependencies
Install the required Node.js dependencies for the frontend:

npm install

### 3. Configure AWS Credentials
Open the app and click on the Upload AWS Credentials button.
Upload your AWS credentials (Access Key ID and Secret Access Key).
The credentials will be stored locally in the browser’s localStorage.
4. Run the development server
Start the development server to view the app in your browser:

npm run dev
Visit http://localhost:5173 to access the uploader.

# Project Overview

This is the **AWS File Batch Uploader** tool. Below is a screenshot of the app in action:

![App Screenshot](https://github.com/madhusudanghule/aws-file-batch-uploader/blob/main/public/images/screenshot.png?raw=true)


![App Screenshot](https://github.com/MadhusudanGhule/aws-file-batch-uploader/blob/main/public/images/screenshot)








