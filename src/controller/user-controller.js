var User = require('../models/user');
var jwt = require('jsonwebtoken');
var config = require('../config/config');
var nodemailer = require('nodemailer');
var Notification= require('../models/notification');
function createToken(user) {
    return jwt.sign({ id: user.id, email: user.email }, config.jwtSecret, {
        expiresIn: 86400 // 86400 expires in 24 hours
    });
}

function usePasswordHashToMakeToken(password, _id, createAt){

    const secret = password+ "-" + createAt;
    const token = jwt.sign({id:_id},secret, {expiresIn:3600});
    return token;

}

exports.registerUser = (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({ 'msg': 'You need to send email and password' });
    }

    User.findOne({ email: req.body.email }, (err, user) => {
        if (err) {
            console.log("error normal",err);
            return res.status(400).json({ 'msg': err });
        }

        if (user) {
            console.log("ya existe",err);
            return res.status(400).json({ 'msg': 'The user already exists' });
        }

        let newUser = User(req.body);
        newUser.startDate = new Date();
        newUser.confirmationEmail = false;
        newUser.deviceMyBand="00";
        newUser.secretKey="00";
        newUser.save((err, user) => {
            if (err) {
                return res.status(400).json({ 'msg': err });
            }

            User.findOne({ email: req.body.email }, (err, user) => {
            var transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: config.gmailUser,
                    pass: config.gmail
                }
            }
            );
            var mensaje = "<html xmlns='http://www.w3.org/1999/xhtml'><head><meta http-equiv='Content-Type' content='text/html; charset=utf-8' /><title>Autorregulacion emocional</title><style type='text/css'> body { margin: 0; padding: 0; min - width: 100 % !important; } .content { width: 100 %; max - width: 600px; }  </style > </head > <body yahoo bgcolor='#f6f8f1'> <table width='100%' bgcolor='#f6f8f1' border='0' cellpadding='0' cellspacing='0'> <tr><td><table class='content' align='center' cellpadding='0' cellspacing='0' border='0'> <tr><td> Bienvenido "+req.body.name+" a autorregulación emocional <br/> Sólo te queda un único paso, pincha en este link para verificar tu correo electrónico<br/><a href='https://servidor-proyecto.herokuapp.com/api/confirmation/"+user._id+"'>Confirmar email</a><br/>En el caso de que este email no tenga nada que ver contigo por favor ignóralo.</td> </tr></table> </td></tr> </table> </body></html > ";
            var mailOptions =
            {
                from: 'Autorregulacion emocional <'+config.gmailUser+'>',
                to: req.body.email,
                subject: 'Verifica tu email en autorregulación emocional',
                html: mensaje
            }
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log("ha habido un error", error);
                    res.send(error);
                } else {
                    console.log("todo ok en principio", info.response);
                    res.send(info.response);
                }
            });
        });
            return res.status(201).json(user);
        });
    });
};

exports.confirmation = (req, res) => {
    User.findOne({ _id: req.params.id }, (err, user) => {

        if (err){
            return res.status(200).send("<html xmlns='http://www.w3.org/1999/xhtml'><head><meta http-equiv='Content-Type' content='text/html; charset=utf-8' /><title>Autorregulacion emocional</title><style type='text/css'> body { margin: 0; padding: 0; min - width: 100 % !important; } .content { width: 100 %; max - width: 600px; }  </style > </head > <body yahoo bgcolor='#f6f8f1'> <table width='100%' bgcolor='#f6f8f1' border='0' cellpadding='0' cellspacing='0'> <tr><td><table class='content' align='center' cellpadding='0' cellspacing='0' border='0'> <tr><td> No hemos podido verificar tu correo electrónico, por favor vuelve a registrarte o ponte en contacto con nuestro equipo en la direccion autorregulacionemocional@gmail.com </td> </tr></table> </td></tr> </table> </body></html > " );
        }
        if (user){
            user.updateOne({confirmationEmail:true},user, function(err, user){
                if(err){
                    console.log("Confirmación erronea");
                    return res.status(400).send(err);
                }else{
                    console.log("confirmación existosa",user);
                    return res.status(200).send("<html xmlns='http://www.w3.org/1999/xhtml'><head><meta http-equiv='Content-Type' content='text/html; charset=utf-8' /><title>Autorregulacion emocional</title><style type='text/css'> body { margin: 0; padding: 0; min - width: 100 % !important; } .content { width: 100 %; max - width: 600px; }  </style > </head > <body yahoo bgcolor='#f6f8f1'> <table width='100%' bgcolor='#f6f8f1' border='0' cellpadding='0' cellspacing='0'> <tr><td><table class='content' align='center' cellpadding='0' cellspacing='0' border='0'> <tr><td> Felicidades <br/>Ya se ha validado tu email con éxito, ya puedes acceder a la app con tu usuario y contraseña, gracias por confiar en nosotros!</td> </tr></table> </td></tr> </table> </body></html > " );
                }
            });
        }

    });
}


exports.loginUser = (req, res) => {
   
    if (!req.body.email || !req.body.password) {
        return res.status(400).send({ 'msg': 'You need to send email and password' });
    }

    User.findOne({ email: req.body.email }, (err, user) => {
        if (err) {
            return res.status(400).send({ 'msg': "Usuario no existe" });
        }

        
        if (!user) {
            return res.status(400).json({ 'msg': 'The user does not exist' });
        } 
        
       


        user.comparePassword(req.body.password, (err, isMatch) => {
            if (isMatch && !err) {
                if (!user.confirmationEmail){
                    return res.status(400).json({'msg':'The email is not confirmed, please look in the inbox of your email and click on the link we have sent to confirm the email. Thank you'});
                }else{
                return res.status(200).json({
                    token: createToken(user)
                });
            }
            } else {
                return res.status(400).json({ msg: 'The email and password don\'t match.' });
            }
        });
    });

    
};


exports.sendEmailResetPassword=(req, res)=>{
    const email = req.body.email;
    User.findOne({ email: req.body.email }, (err, user) => {
        if (err) {
            return res.status(400).send({ 'msg': err });
        }
        if (!user) {
            return res.status(400).json({ 'msg': 'The user does not exist' });
        }

        const token= usePasswordHashToMakeToken(user.password, user._id, user.startDate);
        const url = config.urlBase+'/api/password/reset/'+user._id+"/"+token;
        const emailTemplate=`
        <p>Hey ${user.name || user.email},</p>
        <p>We heard that you lost your Backwoods password. Sorry about that!</p>
        <p>But don’t worry! You can use the following link to reset your password:</p>
        <a href=${url}>${url}</a>
        <p>If you don’t use this link within 1 hour, it will expire.</p>
        <p>Do something outside today! </p>
        <p>–Your friends at Backwoods</p>
        `;
        var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: config.gmailUser,
                pass: config.gmail
            }
        }
        );
         var mailOptions =
        {
            from: 'Autorregulacion emocional <'+config.gmailUser+'>',
            to: req.body.email,
            subject: 'Verifica tu email en autorregulación emocional',
            html: emailTemplate
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log("ha habido un error", error);
                res.send(error);
            } else {
                console.log("todo ok en principio", info.response);
                res.status(200).json({"msg":"ok"});
            }
        });

    });

}


exports.receiveNewPassword=(req,res)=>{
    let token = req.params.token;
   // const password=req.body.password;
    User.findOne({ _id: req.params.id}, (err, user) => {
        if (err) {
            return res.status(400).send({ 'msg': err });
        }
        if (!user) {
            return res.status(400).json({ 'msg': 'The user does not exist' });
        }
        let start=user.startDate.toString();
    
        let secret = user.password + "-" + start;

        jwt.verify(token, secret, function(err, payload) {
            if (err) {
              res.status(401).send("<html xmlns='http://www.w3.org/1999/xhtml'><head><meta http-equiv='Content-Type' content='text/html; charset=utf-8' /><title>Autorregulacion emocional</title><style type='text/css'> body { margin: 0; padding: 0; min - width: 100 % !important; } .content { width: 100 %; max - width: 600px; }  </style > </head > <body yahoo bgcolor='#f6f8f1'> <table width='100%' bgcolor='#f6f8f1' border='0' cellpadding='0' cellspacing='0'> <tr><td><table class='content' align='center' cellpadding='0' cellspacing='0' border='0'> <tr><td> Bienvenido a autorregulación emocional <br/> Este enlace no es correcto, regístrese en nuestra app.</td> </tr></table> </td></tr> </table> </body></html > ")
            } else {
              
                if (payload.id == user._id){
                    if (req.body.password){
                        user.password=req.body.password;
                        user.save((err, user) => {
                            if (err) {
                                return res.status(400).json({ 'msg': err });
                            }
                        });
                    }else{
                       
                        return res.status(200).send("<html xmlns='http://www.w3.org/1999/xhtml'><head><meta http-equiv='Content-Type' content='text/html; charset=utf-8' /><title>Autorregulacion emocional</title><style type='text/css'> body { margin: 0; padding: 0; min - width: 100 % !important; } .content { width: 100 %; max - width: 600px; }  </style > </head > <body yahoo bgcolor='#f6f8f1'> <table width='100%' bgcolor='#f6f8f1' border='0' cellpadding='0' cellspacing='0'> <tr><td><table class='content' align='center' cellpadding='0' cellspacing='0' border='0'> <tr><td> Bienvenido "+user.name+" a autorregulación emocional <br/> Introduce la nueva contraseña:<br/><form action='"+config.urlBase+"/api/password/reset/"+req.params.id+"/"+token+"' method='post'>Nueva contraseña:<br/><input type='text' name='password'/><input type='submit' value='enviar'/></form></td> </tr></table> </td></tr> </table> </body></html >");
                    }
                
                    return res.status(201).send("<html xmlns='http://www.w3.org/1999/xhtml'><head><meta http-equiv='Content-Type' content='text/html; charset=utf-8' /><title>Autorregulacion emocional</title><style type='text/css'> body { margin: 0; padding: 0; min - width: 100 % !important; } .content { width: 100 %; max - width: 600px; }  </style > </head > <body yahoo bgcolor='#f6f8f1'> <table width='100%' bgcolor='#f6f8f1' border='0' cellpadding='0' cellspacing='0'> <tr><td><table class='content' align='center' cellpadding='0' cellspacing='0' border='0'> <tr><td> Bienvenido "+user.name+" a autorregulación emocional <br/> Tu contraseña ha sido cambiada con éxito</td> </tr></table> </td></tr> </table> </body></html > ");
                 
               }else{
        
                    return res.status(404).json('Invalid user');
                }
        
            }
          })

        
      

    });

}

exports.getNotificationPush=(req, res) => {
   // return res.json({ msg: `Hey ${req.user.email}! I open at the close.` });

    User.findOne({ _id: req.user.id}, (err, user) => {
        if (err) {
            return res.status(400).send({ 'msg': err });
        }
        if (!user) {
            return res.status(400).json({ 'msg': 'The user does not exist' });
        }
    Notification.find({idUser :req.user.id} ,(err, notifications) => {
        if (err) {
            return res.status(400).send({ 'msg': err });
        }
            res.status(200).send(notifications);
        });

    });
}

exports.addPushNotification=(req, res)=>{

    User.findOne({ _id: req.user.id}, (err, user) => {
        if (err) {
            return res.status(400).send({ 'msg': err });
        }
        if (!user) {
            return res.status(400).json({ 'msg': 'The user does not exist' });
        }
        let newNotification = Notification(req.body);
        newNotification.startDate = new Date();
        newNotification.idUser = req.user.id;
        newNotification.open=false;
        newNotification.save((err, notification) => {
            if (err) {
                return res.status(400).json({ 'msg': err });
            }else{
                console.log("the user "+req.user.id+" tiene una nueva notificación");
                res.status(200).send(notification._id);
            }
        });

    });


}


exports.removePushNotification=(req, res)=>{

        Notification.remove({ _id: req.params.id}, (err, notification) => {
        if (err) {
            return res.status(400).send({ 'msg': err });
        }
        if (!notification) {
            return res.status(400).json({ 'msg': 'The notification does not exist' });
        }

        return res.status(200).send({"msg":'Eliminado la notificación '+req.params.id+' correctamente'});


    });


};


exports.openPushNotification=(req,res)=>{

    Notification.findOne({ _id: req.params.id}, (err, notification) => {
        if (err) {
            return res.status(400).send({ 'msg': err });
        }
        if (!notification) {
            return res.status(400).json({ 'msg': 'The notification does not exist' });
        }

        Notification.update(
            { _id: req.params.id},
            {$set: { "open" : true}},(err, notification)=>{
                return res.status(200).send({"msg":'Notificación '+req.params.id+' abierta'});
            });
        


    });

}

exports.setDataMyBand=(req, res)=>{
    User.findOne({ _id: req.user.id}, (err, user) => {
        if (err) {
            return res.status(400).send({ 'msg': err });
        }
        if (!user) {
            return res.status(400).json({ 'msg': 'The user does not exist' });
        }

        user.secretKey=req.body.secretKey;
        user.deviceMyBand=req.body.deviceMyBand;
        user.save((err, user) => {
            if (err) {
                return res.status(400).json({ 'msg': err });
            }else{
                console.log("datos de la my band introducidos con éxito");
                return res.status(200).json({'msg':"Se han introducido los datos de la myband con éxito"});
            }

        });

       

    });

}

exports.getDataMyBand=(req, res)=>{
    User.findOne({ _id: req.user.id}, (err, user) => {
        if (err) {
            return res.status(400).send({ 'msg': err });
        }
        if (!user) {
            return res.status(400).json({ 'msg': 'The user does not exist' });
        }

        let datos={
            "deviceMyBand":user.deviceMyBand,
            "secretKey":user.secretKey
        }

       
            res.status(200).send(datos);
       

    });

}