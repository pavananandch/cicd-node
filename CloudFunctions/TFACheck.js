  
  module.exports=  (params) => {
    const Nexmo= require('nexmo');
    const nexmo = new Nexmo({
      apiKey: '419d0c99',
      apiSecret: 'hQFc4QNa1jcGV3OF'
      });
      console.log(params);
      return new Promise(function(resolve,reject){
      nexmo.verify.check({request_id: params.requestId, code: params.pin}, (err, result) => {
        if(err) {
            console.log('error occured',err)
          reject ({resData:'error'})
          // handle the error
        } else {
            console.log('Account verification Processed')
            console.log(result);
            resolve ({resData:result.status});
        }
      });
    });
//    return {values:params.phoneNumber}
  };
  