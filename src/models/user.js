var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
  
var UserSchema = new mongoose.Schema({
  email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true
    },
  password: {
        type: String,
        required: true
    },
    startDate:{
        type:Date
    },
    birthDate:{
        type:Date,
        required:true,
        lowercase:true,
        trim:true
    },
    name:{
        type:String,
        required:true,
        lowercase:true,
        trim:true
        
    },
    surname:{
        type:String,
        required:true,
        lowercase:true,
        trim:true
    },
    confirmationEmail:{
        type:Boolean,
        required:true,
        trim:true,
    },
    deviceMyBand:{
        type:String,
        trim:true
    },
    secretKey:{
        type:String,
        trim:true
    }

});
 
UserSchema.pre('save',  function(next) {
    var user = this;
 
     if (!user.isModified('password')) return next();
 
     bcrypt.genSalt(10, function(err, salt) {
         if (err) return next(err);
 
         bcrypt.hash(user.password, salt, function(err, hash) {
             if (err) return next(err);
 
             user.password = hash;
             next();
         });
     });
});
 
UserSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};
 
module.exports = mongoose.model('User', UserSchema);