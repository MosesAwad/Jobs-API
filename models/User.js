const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        minLength: 3,
        maxLength: 50
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please provide a valid email',
        ],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minLength: 6
    },
})

UserSchema.pre('save', async function() {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
})

UserSchema.methods.createJWT = function () {
    return jwt.sign({ userId: this._id, name: this.name }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_LIFETIME
    })
}

UserSchema.methods.comparePassword = async function (candidatePassword) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password)
    return (isMatch)
}

module.exports = mongoose.model('User', UserSchema)

/*
    NOTES

    GENERAL NOTES

        Before we begin, it is important to clarify what exactly we mean y middleware when we refer to middleware in the context 
        of Mongoose. Express middleware operates at the request-response level, intercepting HTTP requests in an Express app. 
        Mongoose middleware, also known as hooks, on the other hand, operate at the model level; intercepting database operations 
        like save, findOne, deleteOne, etc. None of the Mongoose Functions are considered middleware in Express because they do not 
        run in the Express middleware stack. However, an Express route can call Mongoose functions inside its own middleware.

        So, Schema.pre is a middleware function and the name of the function that you pass as an argument to it is the function on 
        which it will act as a middleware. So for example Schema.pre('save', funcToRegister), pre now acts as a middleware to the 
        'save' method. Model.prototype.create automaitcally calls the Model.prototype.save middleware (behind the scenes, so that's 
        why we are using Schema.pre('save')).

        We must use a NON-arrow function because Mongoose automatically binds 'this' to the document class for us in 
        the pre function. So, since we want 'this' to refer to the document (as they have intended), we should NOT 
        use an arrow-function as it will then ignore/override the bind (P.S: .apply()m .bind() and .call() are ignored by 
        arrow functions) and inherit 'this' from its surrounding lexical scope, and since pre is just a middleware registration 
        function, when the middleware actually gets called, it will be called in the global scope. 


        In UserSchema.pre('save', async func(){...}) we are hashing the password with a salt to neutralize Rainbow Tables. But the 
        salt is not being stored in the database (it's not part of our schema), so how come UserSchema.methods.comparePassword still 
        works? How is the candidatePassword matches the stored hashed password (hashed with the salt), which is this.password, if we 
        seemingly lost hold of the salt. Well, the magic lies in how bcrypt works. The generated hashedPassword actually includes the 
        salt inside it! bcrypt doesn't just store the hash of password + salt separately. Instead, it encodes the salt as part of the 
        final hashed output. If you were to log a bcrypt hash, you'd see something like:

            $2a$10$zLnyh1K5sT4wTcPIVbhpUOV2zW.HlPyeJsLHeYk9uDkXw8FgG6n6u
            
            Breaking it down:
                * $2a$ → bcrypt version.
                * 10$ → Cost factor (how many rounds of hashing were applied).
                * zLnyh1K5sT4wTcPIVbhpUO → The salt.
                * V2zW.HlPyeJsLHeYk9uDkXw8FgG6n6u → The actual hashed password.

        bcrypt extracts the salt from this.password, then rehashes candidatePassword using that same salt and checks if the hashes match.
*/

/*
    REFERENCES

    Ref 1 - https://mongoosejs.com/docs/middleware.html
*/