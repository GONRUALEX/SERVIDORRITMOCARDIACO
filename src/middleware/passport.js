var User        = require('../models/user');
var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt  = require('passport-jwt').ExtractJwt;
var config      = require('../config/config');
 
var opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.jwtSecret
}
 
module.exports = new JwtStrategy(opts, function (jwt_payload, done) {
    User.findById(jwt_payload.id, function (err, user) {
        if (err) {
            console.log("Error al intentar acceder a recurso protegido");
            return done(err, false);
        }
        if (user) {
            console.log("se ha accedido a recurso protegido");
            return done(null, user);
        } else {
            console.log("Error al intentar acceder a recurso protegido");
            return done(null, false);
        }
    });
});