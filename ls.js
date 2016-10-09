var app = require('express')();

app.get('/', (req, res) => {
    res.send('l');
})

app.listen(3000, () => {
    console.log('123');
})
