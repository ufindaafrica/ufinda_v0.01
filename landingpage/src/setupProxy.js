module.exports = function (app) {
    app.get('/booking-page', (req, res) => {
        res.sendFile(require('path').resolve(__dirname, '../public/booking-page.html'));
    });
}