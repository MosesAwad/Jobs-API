require('dotenv').config();
require('express-async-errors');
const path = require('path');
const express = require('express');
const app = express();

// extra security packages
const helmet = require('helmet')
const cors = require('cors')
const xss = require('xss-clean')
const rateLimiter = require('express-rate-limit')

// error handler
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

// connect DB
const connectDB = require('./db/connect')

// authentication middleware
const authenticateUser = require('./middleware/authentication')

// routers
const authRouter = require('./routes/auth')
const jobsRouter = require('./routes/jobs')

// middleware registration
app.set('trust proxy', 1) // Note 1
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  })
);
app.use(express.json());
app.use(helmet())
app.use(cors())
app.use(xss())

// default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// routes (and further middleware registration)
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/jobs', authenticateUser, jobsRouter)

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI)
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();

/*
    NOTES

    GENERAL NOTES

      When we deploy our project online (such as to Heroku or Render), we now have to start thinking about how we could make 
      our app more secure. To do so, we simply have to install a few packages which do most of the work for us.

      * 'helmet' module sets various HTTP headers to prevent numerous possible attacks. It's so popular it's even used in 
        numerous other packages as a dependency.

      * 'cors' which stands for cross resource origin sharing, is a library that ensures our API is accesible from numerous 
        different domains. If we do not have 'cors' installed, then we are only able to access our API data from the same 
        domain. For instance, in our previous projects, we did that in the JavaScript file located in the public folder. So 
        essentially, in our previous API's, if we tried to access our API from any other front-end app, we will get a cors 
        error. Croos origin resource sharing is basically a mechanism to allow or restrict requested resources on a web 
        server depending on where the HTTP request was initiated from. By installing the 'cors' package, we essentially make 
        our API accessible to the public.
      
      * 'xss-clean' is a library that sanitizes incoming user requests in req.body, req.query, and req.params. As a result, it 
        protects us from cross-site scripting attacks where the attackers tries to inject some malicious code 
      
      * 'express-rate-limit' is a library that caps the number of requests a user can make within a specified period of time 
        to prevent DoS attacks, not DDoS attacks though.
      
    Note 1
      Since we are going to push our project to a reverse proxy like Heroku, Render, Nginx, etc., the 'express-rate-limit' 
      docs recommend that we set this value, 'trust proxy', to true. Now this, is an Express property, not 
      exclusive to 'express-rate-limit' library, but for the library to work, they recommend setting this  Express 
      property to 1 (yes 1 and not true, it makes a difference in this case) (see Ref 1 for details).

*/

/*
    REFERENCES

      Ref 1 - https://expressjs.com/en/guide/behind-proxies.html
*/