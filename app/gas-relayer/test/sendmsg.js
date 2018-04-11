$(function(){
    
    const connUrl = "ws://localhost:8546";
    let web3 = new Web3(connUrl);
    window.web3 = web3;

    let keyPair;

    web3.shh.newKeyPair().then(async function(kid){
        $('.pub').text(await web3.shh.getPublicKey(kid));
        $('.priv').text(await web3.shh.getPrivateKey(kid));
        keyPair = kid;
        window.signature = kid;

        web3.shh.subscribe('messages', {
            "privateKeyID": signature,
            "ttl": 20,
            "minPow": 0.8,
            "powTime": 1000
        }, function(error, message, subscription){
            console.log(web3.utils.hexToAscii(message.payload));
            $('#messageArea').text(web3.utils.hexToAscii(message.payload));
        });


    });

    console.log("Connected to: %c%s", 'font-weight: bold', connUrl);

    const add0x = function(elem){
        if(elem.val().slice(0, 2) != '0x'){
            return '0x' + elem.val();
        } else {
            let val = elem.val();
            elem.val(elem.val().slice(2));
            return val;
        }
    }

    $('button').on('click', async function(e){
        e.preventDefault();
        
        $('p.result').text('');

        let publicKey = add0x($("#publicKey"));
        let msgTopic = add0x($('#topic'));
        let msgPayload = add0x($('#payload'));
        let timeToLive = $('#ttl').val();
        let powTarget = $('#powTarget').val();
        let powTime = $('#powTime').val();

        $('.invalid-feedback').hide();
        $('.is-invalid').removeClass('is-invalid');

        if(!/^0x[0-9a-f]{130}$/i.test(publicKey)){
            $('#publicKey').addClass('is-invalid');
            $('.invalid-feedback.publicKey').show();
        }
        
        if(!/^0x[0-9a-f]{8}$/i.test(msgTopic)){
            $('#topic').addClass('is-invalid');
            $('.invalid-feedback.topic').show();
        }

        if(!/^0x[0-9a-f]+$/i.test(msgPayload) || msgPayload.length%2 > 0){
            $('#payload').addClass('is-invalid');
            $('.invalid-feedback.payload').show();
        }
        
        if(!/^[0-9]+$/i.test(timeToLive)){
            $('#ttl').addClass('is-invalid');
            $('.invalid-feedback.ttl').show();
        }

        if(!/^[+-]?([0-9]*[.])?[0-9]+$/.test(powTarget)){
            $('#powTarget').addClass('is-invalid');
            $('.invalid-feedback.powTarget').show();
        }

        if(!/^[+-]?([0-9]*[.])?[0-9]+$/.test(powTime)){
            $('#powTime').addClass('is-invalid');
            $('.invalid-feedback.powTime').show();
        }


        if($('.is-invalid').length > 0) return;

        console.log(`%c await web3.shh.post({pubKey: "${publicKey}", sig: signature, ttl: ${timeToLive}, powTarget: ${powTarget}, powTime: ${powTime}, topic: "${msgTopic}", payload: "${msgPayload}"})`, 'font-weight: bold');

        let identity;
        
           
        web3.shh.post({ pubKey: publicKey, 
                    sig: keyPair,
                    ttl: parseInt(timeToLive), 
                    powTarget: parseFloat(powTarget), 
                    powTime: parseFloat(powTime), 
                    topic: msgTopic, 
                    payload: msgPayload})
            .then(result => {
                console.log(result);
                $('p.result').html("<b>Response:</b> " + result);
            });
    });
});