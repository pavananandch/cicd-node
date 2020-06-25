  
  module.exports=  (params)=> {
    const Nexmo= require('nexmo');
    const nexmo = new Nexmo({
      apiKey: '419d0c99',
      apiSecret: 'hQFc4QNa1jcGV3OF'
      });
      return new Promise(function(resolve,reject){
        nexmo.verify.request({format:'json', number: params.phoneNo, country:'IN', pin_expiry:120, brand: 'Viva Bot'}, (err, result) => {
          console.log('inside the nexmo');
          if(err) {
            console.log(err)
            reject ({resData:{result:'error'}});
          } else {
            console.log(result)
            resolve({resData:{result:result}})
            // if(result.status == '0') {
            //   resolve({resData:{result:'success',requestId: result.request_id}}); // Success! Now, have your user enter the PIN
            // } else {
            //   reject({resData:{result:'error'}});
            // }
          }
        });
      })
   
//    return {values:params.phoneNumber}
  };
  
  //exports.main({"phoneNo":"9951818285"});