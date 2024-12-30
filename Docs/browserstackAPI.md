---
created: 2024-12-30T10:31:06 (UTC +02:00)
tags: []
source: https://www.browserstack.com/screenshots/api#generate-screenshots
author: 
---

# Screenshots API for Quick Testing on 3000+ Real Browsers | BrowserStack

> ## Excerpt
> Use Screenshots API to test your Website on Chrome, IE, Firefox and Safari for Cross Browser compatibility on desktop browsers and real mobile devices.

---
The Screenshots API allows headless creation of screenshots for a URL. The API allows selection of OS and browsers, starting and stopping screenshot generation.


### Authentication

All methods need to authenticate who you are before running any process. Authentication is done using your username and BrowserStack access key within the HTTP request. For example:

```
<span>$ curl </span><span>-</span><span>u </span><span>"iakovvolfkovich_F75ojQ:HYAZ4DUHsvFrouzKZqyj"</span><span> https</span><span>:</span><span>//www.browserstack.com/screenshots</span>
```

**Warning:** A 401 Unauthorized response is given if an unauthorized request is made.

### Get list of available OS and browsers

**Usage**

```
<span>GET </span><span>/</span><span>screenshots</span><span>/</span><span>browsers</span><span>.</span><span>json</span>
```

**Example**

```
<span>curl </span><span>-</span><span>u </span><span>"iakovvolfkovich_F75ojQ:HYAZ4DUHsvFrouzKZqyj"</span><span> </span><span>-</span><span>H </span><span>"Content-Type: application/json"</span><span> </span><span>-</span><span>H </span><span>"Accept: application/json"</span><span>  </span><span>-</span><span>d </span><span>'{"browsers": [{"os": "Windows", "os_version": "7", "browser_version": "8.0", "browser": "ie"}], "url": "http://google.com"}'</span><span> https</span><span>:</span><span>//www.browserstack.com/screenshots</span>
```

**Response**

```
<span>[</span><span>
  </span><span>{</span><span>
    </span><span>"os"</span><span>:</span><span> </span><span>"Windows"</span><span>,</span><span>
    </span><span>"os_version"</span><span>:</span><span> </span><span>"XP"</span><span>,</span><span>
    </span><span>"browser"</span><span>:</span><span> </span><span>"chrome"</span><span>
    </span><span>"browser_version"</span><span>:</span><span> </span><span>"21.0"</span><span>
    </span><span>"device"</span><span>:</span><span> </span><span>null</span><span>
  </span><span>}</span><span>
  </span><span>{</span><span>
    </span><span>"os"</span><span>:</span><span> </span><span>"ios"</span><span>,</span><span>
    </span><span>"os_version"</span><span>:</span><span> </span><span>"6.0"</span><span>,</span><span>
    </span><span>"browser"</span><span>:</span><span> </span><span>"Mobile Safari"</span><span>
    </span><span>"browser_version"</span><span>:</span><span> </span><span>null</span><span>
    </span><span>"device"</span><span>:</span><span> </span><span>"iPhone 4S (6.0)"</span><span>
  </span><span>}</span><span>
  </span><span>....</span><span>
</span><span>]</span>
```

### Generate screenshots for a URL

| Parameters | Value |
| --- | --- |
| **url**  
The URL of the desired page. | Example: www.example.com |
| **os**  
OS you want to test. | Windows, OS X, ios, android  
Example: Windows |
| **os\_version**  
The OS version you want to test. | Example: 8.1 |
| **browser**  
The browser you want to test. | ie, chrome, firefox, safari, opera, Android Browser  
Example: chrome |
| **browser\_version**  
The browser version you want to test. | Example: 31.0 |
| **device**  
Required if you want to test on a mobile device. | Example: iPhone 4S |
| **orientation**  
Required if specifying the screen orientation for the device. | portrait, landscape  
**Default:** portrait |
| **mac\_res**  
Required if specifying the screen resolution for browsers on OSX. | **Default:** 1024x768  
**Values:** 1024x768, 1280x960, 1280x1024, 1600x1200, 1920x1080 |
| **win\_res**  
Required if specifying the screen resolution for browsers on Windows. | **Default:** 1024x768  
**Values:** 1024x768, 1280x1024 |
| **quality**  
Required if specifying the quality of the screenshot. | **Default:** Compressed  
**Values:** Original, Compressed |
| **local**  
Required if the page is local and that a Local Testing connection has been set up. | **Default:** false  
<small><strong>Values:</strong></small> true, false |
| **wait\_time**  
Required if specifying the time (in seconds) to wait before taking the screenshot. | **Default:** 5  
**Values:** 2, 5, 10, 15, 20, 60 |
| **callback\_url** | **Default:** nil  
Required if results are to be sent back to a public URL |

**Note:** If specified, the data will be posted to **callback\_url** , which must be a valid URL. The response contains a listing of all screenshots generated once processing has completed. Alternatively, the response is accessible using [GET /screenshots/<JOB-ID>.json](https://www.browserstack.com/screenshots/api#screenshots-states).

**Usage**

```
<span>POST </span><span>/</span><span>screenshots
</span><!-- <strong><span>The request should be a JSON POST.</span></strong> --><span>
</span><span>{</span><span>
  </span><span>"url"</span><span>:</span><span>"www.google.com"</span><span>,</span><span>
  </span><span>"callback_url"</span><span>:</span><span> </span><span>"http://staging.example.com"</span><span>,</span><span>
  </span><span>"win_res"</span><span>:</span><span> </span><span>"1024x768"</span><span>,</span><span>
  </span><span>"mac_res"</span><span>:</span><span> </span><span>"1920x1080"</span><span>,</span><span>
  </span><span>"quality"</span><span>:</span><span> </span><span>"compressed"</span><span>,</span><span>
  </span><span>"wait_time"</span><span>:</span><span> </span><span>5</span><span>,</span><span>
  </span><span>"orientation"</span><span>:</span><span> </span><span>"portrait"</span><span>,</span><span>
  </span><span>"browsers"</span><span>:[</span><span>
   </span><span>{</span><span>
     </span><span>"os"</span><span>:</span><span>"Windows"</span><span>,</span><span>
     </span><span>"os_version"</span><span>:</span><span>"XP"</span><span>,</span><span>
     </span><span>"browser"</span><span>:</span><span>"ie"</span><span>,</span><span>
     </span><span>"browser_version"</span><span>:</span><span>"7.0"</span><span>
   </span><span>},</span><span>
   </span><span>{</span><span>
     </span><span>"os"</span><span>:</span><span>"ios"</span><span>,</span><span>
     </span><span>"os_version"</span><span>:</span><span>"6.0"</span><span>,</span><span>
     </span><span>"device"</span><span>:</span><span>"iPhone 4S (6.0)"</span><span>
    </span><span>},</span><span>
    </span><span>....</span><span>
  </span><span>],</span><span>
</span><span>}</span>
```

**Response**

```
<span>{</span><span>
  </span><span>"job_id"</span><span>:</span><span>"13b93a14db22872fcb5fd1c86b730a51197db319"</span><span>,</span><span>
  </span><span>"callback_url"</span><span>:</span><span> </span><span>"http://staging.example.com"</span><span>,</span><span>
  </span><span>"win_res"</span><span>:</span><span> </span><span>"1024x768"</span><span>,</span><span>
  </span><span>"mac_res"</span><span>:</span><span> </span><span>"1920x1080"</span><span>,</span><span>
  </span><span>"quality"</span><span>:</span><span> </span><span>"compressed"</span><span>,</span><span>
  </span><span>"wait_time"</span><span>:</span><span> </span><span>5</span><span>,</span><span>
  </span><span>"orientation"</span><span>:</span><span> </span><span>"portrait"</span><span>,</span><span>
  </span><span>"screenshots"</span><span>:</span><span> </span><span>[</span><span>
   </span><span>{</span><span>
     </span><span>"os"</span><span>:</span><span>"Windows"</span><span>,</span><span>
     </span><span>"os_version"</span><span>:</span><span>"XP"</span><span>,</span><span>
     </span><span>"browser"</span><span>:</span><span>"ie"</span><span>,</span><span>
     </span><span>"id"</span><span>:</span><span>"be9989892cbba9b9edc2c95f403050aa4996ac6a"</span><span>,</span><span>
     </span><span>"state"</span><span>:</span><span>"pending"</span><span>,</span><span>
     </span><span>"browser_version"</span><span>:</span><span>"7.0"</span><span>,</span><span>
     </span><span>"url"</span><span>:</span><span>"www.google.com"</span><span>
   </span><span>},</span><span>
   </span><span>{</span><span>
     </span><span>"os"</span><span>:</span><span>"ios"</span><span>,</span><span>
     </span><span>"os_version"</span><span>:</span><span>"6.0"</span><span>,</span><span>
     </span><span>"id"</span><span>:</span><span>"1f3a6054e09592e239e9ea79c247b077e68d3d71"</span><span>,</span><span>
     </span><span>"state"</span><span>:</span><span>"pending"</span><span>,</span><span>
     </span><span>"device"</span><span>:</span><span>"iPhone 4S (6.0)"</span><span>,</span><span>
     </span><span>"url"</span><span>:</span><span>"www.google.com"</span><span>
   </span><span>}</span><span>
  </span><span>....</span><span>
  </span><span>]</span><span>
</span><span>}</span>
```

### Generate the list of screenshots and their states

**Usage**

```
<span>GET </span><span>/</span><span>screenshots</span><span>/&lt;</span><span>JOB</span><span>-</span><span>ID</span><span>&gt;.</span><span>json</span>
```

**Response**

```
<span>{</span><span>
  </span><span>"id"</span><span>:</span><span>"13b93a14db22872fcb5fd1c86b730a51197db319"</span><span>,</span><span>
  </span><span>"state"</span><span>:</span><span>"done"</span><span>,</span><span>
  </span><span>"callback_url"</span><span>:</span><span> </span><span>"http://staging.example.com"</span><span>,</span><span>
  </span><span>"win_res"</span><span>:</span><span> </span><span>"1024x768"</span><span>,</span><span>
  </span><span>"mac_res"</span><span>:</span><span> </span><span>"1920x1080"</span><span>,</span><span>
  </span><span>"quality"</span><span>:</span><span> </span><span>"compressed"</span><span>,</span><span>
  </span><span>"wait_time"</span><span>:</span><span> </span><span>5</span><span>,</span><span>
  </span><span>"screenshots"</span><span>:</span><span> </span><span>[</span><span>
    </span><span>{</span><span>
      </span><span>"os"</span><span>:</span><span>"Windows"</span><span>,</span><span>
      </span><span>"os_version"</span><span>:</span><span>"XP"</span><span>,</span><span>
      </span><span>"browser"</span><span>:</span><span>"ie"</span><span>,</span><span>
      </span><span>"browser_version"</span><span>:</span><span>"7.0"</span><span>,</span><span>
      </span><span>"id"</span><span>:</span><span>"be9989892cbba9b9edc2c95f403050aa4996ac6a"</span><span>,</span><span>
      </span><span>"state"</span><span>:</span><span>"done"</span><span>,</span><span>
      </span><span>"url"</span><span>:</span><span>"www.google.com"</span><span>,</span><span>
      </span><span>"thumb_url"</span><span>:</span><span>"https://www.browserstack.com/screenshots/13b93a14db22872fcb5fd1c86b730a51197db319/thumb_winxp_ie_7.0.jpg"</span><span>,</span><span>
      </span><span>"image_url"</span><span>:</span><span>"https://www.browserstack.com/screenshots/13b93a14db22872fcb5fd1c86b730a51197db319/winxp_ie_7.0.png"</span><span>,</span><span>
      </span><span>"created_at"</span><span>:</span><span>"2013-03-14 16:25:45 UTC"</span><span>
    </span><span>},</span><span>
    </span><span>{</span><span>
      </span><span>"os"</span><span>:</span><span>"Windows"</span><span>,</span><span>
      </span><span>"os_version"</span><span>:</span><span>"7"</span><span>,</span><span>
      </span><span>"browser"</span><span>:</span><span>"ie"</span><span>,</span><span>
      </span><span>"browser_version"</span><span>:</span><span>"8.0"</span><span>,</span><span>
      </span><span>"id"</span><span>:</span><span>"1f3a6054e09592e239e9ea79c247b077e68d3d71"</span><span>,</span><span>
      </span><span>"state"</span><span>:</span><span>"done"</span><span>,</span><span>
      </span><span>"url"</span><span>:</span><span>"www.google.com"</span><span>,</span><span>
      </span><span>"thumb_url"</span><span>:</span><span>"https://www.browserstack.com/screenshots/13b93a14db22872fcb5fd1c86b730a51197db319/thumb_win7_ie_8.0.jpg"</span><span>,</span><span>
      </span><span>"image_url"</span><span>:</span><span>"https://www.browserstack.com/screenshots/13b93a14db22872fcb5fd1c86b730a51197db319/win7_ie_8.0.png"</span><span>,</span><span>
      </span><span>"created_at"</span><span>:</span><span>"2013-03-14 16:25:45 UTC"</span><span>
    </span><span>}</span><span>
   </span><span>]</span><span>
</span><span>}</span>
```
