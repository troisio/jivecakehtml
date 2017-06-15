package main

import (
    "github.com/julienschmidt/httprouter"
    "net/http"
    "log"
    "time"
    "encoding/json"
    "io/ioutil"
    "html/template"
)

type Event struct {
  Id string
  OrganizationId string
  Name string
  Description string
}

type EventSearchResult struct {
  Count uint
  Entity []Event
}

type IndexTemplate struct {
  Title string
  Description string
  OgTitle string
  OgDescription string
  OgLocale string
}

type Settings struct {
  Address string
  Api struct {
    Uri string
  }
}

func publicEventHandler(settings Settings, indexTemplate *template.Template) httprouter.Handle {
  return func(w http.ResponseWriter, r *http.Request, parameters httprouter.Params) {
    defer r.Body.Close()

    client := &http.Client{Timeout: 5 * time.Second}
    id := parameters.ByName("id")

    response, requestError := client.Get(settings.Api.Uri + "/event/search?id=" + id)

    if requestError != nil {
      panic(requestError)
    }

    eventSearchResult := EventSearchResult{}
    body, readyBytesError := ioutil.ReadAll(response.Body)

    if readyBytesError != nil {
        panic(readyBytesError)
    }

    jsonError := json.Unmarshal(body, &eventSearchResult)

    if jsonError != nil {
      panic(jsonError)
    }

    var templateArguments IndexTemplate

    if len(eventSearchResult.Entity) > 0 {
      event := eventSearchResult.Entity[0]
      templateArguments = IndexTemplate{
        Title: event.Name,
        Description: event.Description,
        OgTitle: event.Name,
        OgDescription: event.Description,
        OgLocale: "en-US",
      }
    } else {
      templateArguments = IndexTemplate{
        Title: "JiveCake",
        Description: "Event registration",
        OgTitle: "JiveCake",
        OgDescription: "Event registration",
        OgLocale: "en-US",
      }
    }

    indexTemplate.Execute(w, templateArguments)
  }
}

func main() {
  bytes, _ := ioutil.ReadFile("server-settings.json")
  settings := new(Settings)
  settingsError := json.Unmarshal(bytes, &settings)

  if settingsError != nil {
    panic(settingsError)
  }

  indexTemplate, templateError := template.ParseFiles("app/index.tmpl")

  if templateError != nil {
    panic(templateError)
  }

  router := httprouter.New()
  router.GET("/event/:id", publicEventHandler(*settings, indexTemplate))

  log.Fatal(http.ListenAndServe(settings.Address, router))
}