console.log("Script loaded")

const handleSearchQuery = () => {
    const query = document.querySelector("#searchQuery").value;
    
    const formData = new FormData();
    formData.append("searchQuery", query);

    passToBackend(formData);
}

const passToBackend = (formData) => {
    $.ajax({
        type: "POST",
        url: "/searchTweets",
        data: formData,
        cache: false,
        dataType: false,
        contentType: false,
        sucess: function() {
            console.log("Data Passed Successfully")
        }
    })
}

document.querySelector("#searchQuery").addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      handleSearchQuery();
    }
});



// const tweetStream = document.querySelector('#tweetStream')
// const socket = io()

// const tweets = []

// socket.on('connect', () => {
//     console.log("Connected to Server...")
// })

// socket.on('ListenTweet', (tweet) => {
//     console.log(tweet)
//     const tweetData = {
//         id: tweet.data.id,
//         author_id: tweet.data.author_id,
//         tweet: tweet.data.text,
//         name: tweet.includes.users[0].name,
//         username: `@${tweet.includes.users[0].username}`
//     }

//     const tweetElement = document.createElement('div')
//     tweetElement.className = "card my-4"
//     tweetElement.innerHTML = `
//     <div class = "card-body">
//         <h5 class = "card-title">${tweetData.tweet}</h5>
//         <h6 class = "card-subtitle mb-2 text-muted">${tweetData.username}</h6>
//         <a class = "btn btn-primary mt-3" target = "_blank" href = "https://twitter.com/${tweetData.username}/status/${tweetData.id}">
//             <i class="fab fa-twitter"></i>
//             Go to Tweet
//         </a>
//     `

//     tweetStream.appendChild(tweetElement)
// })