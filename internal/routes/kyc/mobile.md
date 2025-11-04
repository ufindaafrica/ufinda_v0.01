<WebView
    originWhitelist={['*']}
    source={{uri: 'https://identity.dojah.io?widget_id=12345678&user_data[first_name]=John&user_data[middle_name]=Doe&user_data[last_name]=John&user_data[email]&user_data[dob]=1900-04-30&metadata[user_id]='}}
    allowsInlineMediaPlayback={true}
    mediaPlaybackRequiresUserAction={false}
    startInLoadingState={true}
    javaScriptEnabled
    onError={e => console.log('error: ', e)}
  />
  