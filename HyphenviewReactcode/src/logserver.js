import axios from "axios";
const apilogsurls = process.env.REACT_APP_LOGS_URL;
const logMessage = async (userId,status_code, message) => {
    
    try {
        const response = await axios.post(`${apilogsurls}/log`, {
            userId,
            status_code,
            message
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          if (response.status !== 200) {
            throw new Error('Failed to log message');
          }
        } catch (error) {
          console.error('Error logging message:', error);
        }
      };
  
  export default logMessage;
  