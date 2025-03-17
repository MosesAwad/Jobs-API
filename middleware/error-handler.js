const { CustomAPIError } = require('../errors')
const { StatusCodes } = require('http-status-codes')
const errorHandlerMiddleware = (err, req, res, next) => {
  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || 'Something went wrong, please try again later'
  }
  console.log(JSON.stringify(err, null, 2))
  // Handle Duplicate Error (see General Notes to understand the if-statement and to understand the structure of the Duplicate Error object)
  if (err.code && err.code === 11000) {
    customError.statusCode = StatusCodes.BAD_REQUEST
    customError.msg = `Duplicate value entered for the ${Object.keys(err.keyValue)} field. Please choose another value`
  }
  // Handle Validation Error (see General Notes to understand the if-statement and to understand the structure of the Validation Error object)
  if (err.name === 'ValidationError') {
    customError.statusCode = StatusCodes.BAD_REQUEST
    customError.msg = "Validation failed for user creation due to the following reasons: " +
                        Object.values(err.errors).map((subObject)=>subObject.message).join(', ')
  }
  // Handle Cast Error (see General Notes to understand the if-statement and to understand the structure of the Cast Error object)
  if (err.name === 'CastError') {
    customError.statusCode = StatusCodes.NOT_FOUND
    customError.msg = `No job found with an id of ${err.value}`
  }
  return res.status(customError.statusCode).json({ msg: customError.msg })
}

module.exports = errorHandlerMiddleware

/*  
    NOTES

    GENERAL NOTES

    There are three types of Mongoose Errors:
      * Validation errors
          ex: if the user doesn't provide a required path

          sample validation error object looks like this:
               {
                  "errorLabelSet": {},
                  "errorResponse": {
                      "index": 0,
                      "code": 11000,
                      "errmsg": "E11000 duplicate key error collection: JOBS-API.users index: email_1 dup key: { email: \"reusedannaemail@gmail.com\" }",
                      "keyPattern": {
                          "email": 1
                      },
                      "keyValue": {
                          "email": "reusedannaemail@gmail.com"
                      }
                  },
                  "index": 0,
                  "code": 11000,
                  "keyPattern": {
                      "email": 1
                  },
                  "keyValue": {
                      "email": "reusedannaemail@gmail.com"
                  }
              }

        * Duplicate errors
          ex: if email path is given the option of unique: true but you reuse it in another document within that model

          sample duplicate error object looks like this, in the case we do not provide neither email nor password while registering:  
            {
              "errors": {
                "password": {
                  "name": "ValidatorError",
                  "message": "Please provide a password",
                  "properties": {
                    "message": "Please provide a password",
                    "type": "required",
                    "path": "password"
                  },
                  "kind": "required",
                  "path": "password"
                },
                "email": {
                  "name": "ValidatorError",
                  "message": "Please provide an email",
                  "properties": {
                    "message": "Please provide an email",
                    "type": "required",
                    "path": "email"
                  },
                  "kind": "required",
                  "path": "email"
                }
              },
              "_message": "User validation failed",
              "name": "ValidationError",
              "message": "User validation failed: password: Please provide a password, email: Please provide an email"
            }

      * Cast errors
          ex: You give an id a string other than 12 bytes in value (aka something other than a 24 size long hexadecimal value)

          sample cast error object looks like this:
          {
            "stringValue": "\"67d4cc1feb66701a1bb454bee\"",
            "valueType": "string",
            "kind": "ObjectId",
            "value": "67d4cc1feb66701a1bb454bee",
            "path": "_id",
            "reason": {},
            "name": "CastError",
            "message": "Cast to ObjectId failed for value \"67d4cc1feb66701a1bb454bee\" (type string) at path \"_id\" for model \"Job\""
          }
  
    ----------------------------------------------------------------------------------------------------------------------------

    When you console log an error object, not all the properties will be displayed in the terminal. The best example is the error 
    object Mongoose returns when a Validation Error occurs. The reason this happens is not Mongoose's fault, it is the nature of 
    the JavaScript default Error object, which Mongoose error objects (Validation Error, Duplicate Error, Cast Error) inherit from. 
    The properties that don't appear when you console log an error object is because these properties are set to non-enumarable by 
    JavaScript. So if the register controller threw a Validation Error due to a missing email and missing password, here is what 
    would appear in the terminal if you hit console.log(err) in the errorHandleMiddleware function above:
          {
            errors: {
              password: ValidatorError: Please provide a password
                  at validate (/home/moosa/Desktop/node-express-course/06-jobs-api/starter/node_modules/mongoose/lib/schemaType.js:1404:13)
                  at SchemaType.doValidate (/home/moosa/Desktop/node-express-course/06-jobs-api/starter/node_modules/mongoose/lib/schemaType.js:1388:7)
                  at /home/moosa/Desktop/node-express-course/06-jobs-api/starter/node_modules/mongoose/lib/document.js:3082:18
                  at process.processTicksAndRejections (node:internal/process/task_queues:77:11) {
                properties: [Object],
                kind: 'required',
                path: 'password',
                value: undefined,
                reason: undefined,
                [Symbol(mongoose#validatorError)]: true
              },
              email: ValidatorError: Please provide an email
                  at validate (/home/moosa/Desktop/node-express-course/06-jobs-api/starter/node_modules/mongoose/lib/schemaType.js:1404:13)
                  at SchemaType.doValidate (/home/moosa/Desktop/node-express-course/06-jobs-api/starter/node_modules/mongoose/lib/schemaType.js:1388:7)
                  at /home/moosa/Desktop/node-express-course/06-jobs-api/starter/node_modules/mongoose/lib/document.js:3082:18
                  at process.processTicksAndRejections (node:internal/process/task_queues:77:11) {
                properties: [Object],
                kind: 'required',
                path: 'email',
                value: undefined,
                reason: undefined,
                [Symbol(mongoose#validatorError)]: true
              }
            },
            _message: 'User validation failed'
          } 
    
    So we do not see a property called name, even though it exists. That is because Error.name is a non-enumrable property of the Error 
    object in JavaScript. What that means is when you iterate over an error object through Object.keys(ErrorObject), which returns an 
    array of the keys in that object, non-enumrable properties like name do not appear. 
    JavaScript was attempting to reduce 'noise' by doing this as they deem Error.name an important attribute to exist for an Error object 
    but they do not consider it, in their opinion, as part of the Error object's data. So if you would like to see all the properties of an 
    error object, you have two options. They are listen below. 
   
      Option 1 (if you want to see the full error JSON object in the console):
        console.log(JSON.stringify(error, null, 2));
      Option 2 (if you want to see the full error object but in the response, like in Postman):
        return res.status(500).json({ err })

      Output:
        {
          "errors": {
            "password": {
              "name": "ValidatorError",
              "message": "Please provide a password",
              "properties": {
                "message": "Please provide a password",
                "type": "required",
                "path": "password"
              },
              "kind": "required",
              "path": "password"
            },
            "email": {
              "name": "ValidatorError",
              "message": "Please provide an email",
              "properties": {
                "message": "Please provide an email",
                "type": "required",
                "path": "email"
              },
              "kind": "required",
              "path": "email"
            }
          },
          "_message": "User validation failed",
          "name": "ValidationError",
          "message": "User validation failed: password: Please provide a password, email: Please provide an email"
        }
      
    Now, we can see all the properties including the non-enumrable properties like name, and message (yes _message is enumrable 
    but message is not lol).
*/