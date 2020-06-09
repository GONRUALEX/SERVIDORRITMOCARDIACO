var mongoose = require('mongoose');

  
var NotificationSchema = new mongoose.Schema({

 
    idUser:{
        type:String,
        required:true,
        lowercase:true,
        trim:true
        
    },
    data:{
        type:String,
        required:true,
        lowercase:true,
        trim:true
    },
    body:{
        type:String,
        required:true,
        lowercase:true,
        trim:true
    },
    startDate:{
        type:Date
    },
    title:{
        type:String,
        required:true,
        lowercase:true,
        trim:true
    },
    open:{
        type:Boolean,
        required:true,       
    },
});
 


 
module.exports = mongoose.model('Notification', NotificationSchema);