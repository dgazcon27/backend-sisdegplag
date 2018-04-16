module.exports = {
    parseDate: function (date) {
        // server date 2017-11-09T03:00:25.000Z
      var today = new Date(date);
      var dd = today.getDate() ;
      dd = dd < 10 ?'0'+dd  :dd;
      var mm = today.getMonth()+1; //January is 0!
      mm = mm < 10 ?'0'+mm :mm;
      var yyyy = today.getFullYear();

      var seconds = today.getSeconds();
      seconds = seconds < 10 ? '0'+seconds: seconds;
      var minutes = today.getMinutes();
      minutes = minutes < 10 ? '0'+minutes: minutes;
      var hour = today.getHours();
      hour = hour < 10 ? '0'+hour : hour;

      return (yyyy+ '-'+mm+'-'+dd+'T'+hour+':'+minutes+':00.000Z');
    },
    getCredentials: function () {
      var myCredentials = {
        consumer_key: 'r7BhWP7PeQB3LQcJAfAAiP7fa',
        consumer_secret: 'kNXOZT9C0TmtwNodl6BDKlu3qAJQubU0JYbZNpe9SsCI0fblU5',
        access_token_key: '221469048-U5Ci8XqR4eMf1KfTYV86faTGaVw8PT6gJp5K8PPF',
        access_token_secret: 'jDjg2neOUwWttb1NmRg2cvud4AOb2zCqeNdyQHzWy0fJx'
      }
      
      return myCredentials;
    }

};