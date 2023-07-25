const bcrypt = require('bcryptjs') ;
const crypto = require('crypto');

class MongoClass{

  async checkPassword(plainPassword,hashedPassword){
    return await bcrypt.compare(plainPassword,hashedPassword);
  }
    
  rejectOnPasswordChangeAfterTokenIssued(JWT_iat){
    
    if(this.passwordChangedAt){
      const changedAt
            = parseInt(this.passwordChangedAt.getTime()/1000,10);
      return JWT_iat < changedAt;
    }
    return false;
  }
    
  // generate token for verification or password reset
  generateOneTimeToken(validTill){
            
    const plainOneTimeToken = crypto.randomBytes(16).toString('hex');
    
    const hashedOneTimeToken = crypto.createHash('sha256').update(plainOneTimeToken).digest('hex');
    this.oneTimeToken = hashedOneTimeToken;
    this.oneTimeTokenExpires = Date.now() + validTill * 60 * 1000;
    return plainOneTimeToken;
  }
    
  // Abstract these from data return to client
  toJSON(object){
    object = this;
    const data = object.toObject();
    
    delete data.oneTimeToken;
    delete data.oneTimeTokenExpires;
    delete data.passwordChangedAt;
    delete data.confirmPassword;
    delete data.password;
    delete data.__v;
    
    return data;
  }
}

module.exports = MongoClass;