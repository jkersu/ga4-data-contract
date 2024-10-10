// Good event
dataLayer.push({
    'event': 'login',
    'method': 'password',
    'user_id' : '123'
});

/* Example of bad event: 
    - method should be one of email, google, facebook
    - user_id should match the regex pattern ^[0-9]*$
*/ 
dataLayer.push({
    'event': 'login',
    'method': 'password',
    'user_id' : 'a123'
});