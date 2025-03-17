const mongoose = require('mongoose')

const JobSchema = new mongoose.Schema({
    role: {
        type: String,
        required: [true, 'Please provide a role'],
        maxLength: 100

    },
    company: {
        type: String,
        required: [true, 'Please enter a company name'],
        maxLength: 50
    },
    status: {
        type: String,
        enum: ['interview', 'pending', 'declined'],
        default: 'pending'
    },
    createdBy: {
        type: mongoose.ObjectId,
        ref: 'User', // Note 1
        required: [true, 'Please provide a user']
    }
}, {timestamps: true}) // Note 2

module.exports = mongoose.model("Job", JobSchema)

/*
    NOTES

    GENERAL NOTES

        What do they mean by path when in the docs? Put simply, a path are the keys of the Schema, the properties. So in our Schema here, 
        the JobSchema, the paths are position, company, status, and createdBy. So, the Schema class in Mongoose is a configuration object 
        for a model. Similarly, the SchemaType class is a configuration object for a property; aka, the SchemaType class is the paths 
        themselves.
 
            Ex:
                Line 1 - JobSchema.path('position') instanceof mongoose.SchemaType; // true
                Line 2 - JobSchema.path('position') instanceof mongoose.Schema.Types.String; // true
                Line 3 - JobSchema.path('position').instance; // 'String'
        
        In line 1 and Line 2, both mongnoose.SchemaType & mongoose.Schema.Types are the same thing, it is just that the latter is older 
        (see Ref 4). 
        
        (As per Ref 2), a SchemaType is different from a type. In other words, mongoose.ObjectId !== mongoose.Types.ObjectId. (See Ref 4 
        and Ref 5) for the difference. A SchemaType is just a configuration object for Mongoose. An instance of the mongoose.ObjectId 
        SchemaType doesn't actually create MongoDB ObjectIds, it is just a configuration for a path in a schema. 

        mongoose.ObjectId (as per ref 6) is a direct way to reference the SchemaType of ObjectId. So we can use it in here to say:
            createdBy: {
                type: mongoose.ObjectId,
                ref: 'User' // Note 1
            }
        because that's literally what we are doing, configuring the path called createdBy to be of type ObjectId. If we were to manually 
        assign an id (not let MongoDB generate it automatically), then we need to use mongoose.Types.ObjectId as follows (this code is 
        taken from Ref 1):
            
            const schema = mongoose.Schema({ testId: mongoose.ObjectId });
            const someModel = mongoose.model('Test', schema);
            Option 1:
                const doc = new someModel({ testId: '5d6ede6a0ba62570afcedd3a' });
                // `testId` is an ObjectId, Mongoose casts 24 hex char strings to ObjectIds for you automatically based on your schema.
                doc.testId instanceof mongoose.Types.ObjectId; // true

        In above scenario, doc.testId was automatically assigned a type of mongoose.Types.ObjectId (Mongoose Type) class that is since the 
        Model constructor. The Model constructor knew it should do that because testId was defined as mongoose.ObjectId (Mongoose SchemaType) 
        in the schema. But you can also manually assign the type mongoose.Types.ObjectId as follows:
            
        Option 2:
            const doc = new someModel({ testId: new Mongoose.Types.ObjectId('5d6ede6a0ba62570afcedd3a') }); 
    
        Option 3 (effectively same as Option 2):
            const ObjectId = mongoose.Types.ObjectId;
            const doc = new someModel({ testId: new ObjectId('5d6ede6a0ba62570afcedd3a') }); 


    Note 1

        The argument has to be the model name, the model name is Job. The collection's name (which appears on MongoDB) is jobs (see Ref 3)
    
    Note 2

        This adds the additional fields of 'createdAt' and 'updatedAt' to the documents of this model. 
*/

/*
    REFERENCES

        Ref 1 - https://masteringjs.io/tutorials/mongoose/objectid
        Ref 2 - https://mongoosejs.com/docs/schematypes.html#what-is-a-schematype
        Ref 3 - https://mongoosejs.com/docs/api/schematype.html#SchemaType.prototype.ref()
        Ref 4 - https://mongoosejs.com/docs/api/mongoose.html#Mongoose.prototype.SchemaTypes
        Ref 5 - https://mongoosejs.com/docs/api/mongoose.html#Mongoose.prototype.Types
        Ref 6 - https://mongoosejs.com/docs/api/mongoose.html#Mongoose.prototype.ObjectId
*/