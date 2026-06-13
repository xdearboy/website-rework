---
title: what is the max messenger, and why does it even exist
excerpt: what max is, what it collects, and why things aren't so rosy
---
# max - an honest breakdown: what this state messenger is, what it collects, and why things aren't so rosy

max is a new "national" messenger that's being actively pushed in russia. on the surface it looks nice: chats, calls, government services, a digital id. but let's dig into what's actually inside, what data it pulls, and what could happen to your messages.

---

## what it is
max was made by vk and is positioned as a superapp. starting september 1, 2025, it'll be preinstalled on devices instead of vk messenger. ([wikipedia](https://ru.wikipedia.org/wiki/Max_%28%D0%BC%D0%B5%D1%81%D1%81%D0%B5%D0%BD%D0%B4%D0%B6%D0%B5%D1%80%29))

here's the key thing: this is a state-oriented solution, officially listed in the russian software registry, with tight integration into the government's ecosystem.

---

## the government background
why does this matter? because the law requires storing metadata and handing it over on request from the authorities. on top of that, max is already working on a "digital id" - tied to government services, meaning even more personal data inside. ([habr](https://habr.com/ru/news/947144/))

---

## what permissions it asks for
analysis of the apk and manifest shows max requests a pretty hefty list:

- access to contacts (**read_contacts**, **write_contacts**) ([habr](https://habr.com/ru/articles/938518/))
- camera and microphone (**camera**, **record_audio**) ([habr](https://habr.com/ru/articles/938518/))
- location, including background requests ([habr](https://habr.com/ru/articles/938518/))
- reading and writing media ([habr](https://habr.com/ru/articles/945306/))
- launching on system startup, drawing windows over other apps ([habr](https://habr.com/ru/articles/945306/))

and the classics: integrations with analytics and push services, including huawei hms and firebase. ([habr](https://habr.com/ru/articles/938518/))

---

## encryption and storage
an important point: there's no e2e (end-to-end encryption) by default. ([habr](https://habr.com/ru/articles/938518/))
the local database on android is stored without sqlcipher - meaning no encryption on disk.

that means part of the data could be accessible on the server, and by law it could realistically be handed over on request.

---

## where the data goes
based on network traffic analysis - to cdns, analytics (telemetry), and media servers. ([habr](https://habr.com/ru/articles/938518/))
the servers are stated to be located in russia, which means all local laws apply.

---

## handing over chats on request
this part is simple: if a service stores data on its own servers (and max does), then under the "yarovaya package" and related laws, access to your messages is possible given a procedural request. e2e doesn't save you here, because there isn't any - unlike signal or telegram's secret chats.

---

## risks
- you might thoughtlessly grant access to contacts, location, and microphone, and all of it ends up on the servers;
- chats are theoretically accessible by law;
- unverified mods could be more dangerous than the original.

---

## my advice
- only download from official stores or trusted sources;
- don't grant every permission without thinking, especially location and microphone;
- for private conversations use signal, or at least telegram's secret chats;
- if you're testing mods, use a separate device or check them on [virustotal](https://virustotal.com).

---

## about mods and "stripped" telemetry
> **warning.** links to mods are always a risk. authors claim they've removed analytics and tracking, but who knows what's really in there. the apk could contain a backdoor or simply never get updates. install at your own risk only.

- more useful info about max is also on 4pda: [link](https://4pda.to/forum/index.php?showtopic=1104314);
- a mod on 4pda: [link](https://4pda.to/forum/index.php?showtopic=1104314&st=2160#entry139227792);
- another mod on github, "reMax": [link](https://github.com/remax-mod/remax);

---

## conclusion
max isn't just another messenger - it's a state-oriented product with its own functionality and integrations. it's convenient for calls and chatting, but if privacy matters to you, keep a level head and remember that by law your messages could realistically be handed over.

---

## sources
- [habr - apk breakdown of max](https://habr.com/ru/articles/938518/)
- [habr - what's visible in androidmanifest](https://habr.com/ru/articles/939868/)
- [habr - max without the shell](https://habr.com/ru/articles/945306/)
- [habr - comparing permissions of max, telegram, and whatsapp](https://habr.com/ru/articles/939006/)
- [habr - digital id in max](https://habr.com/ru/news/947144/)
- [wikipedia - max (messenger)](https://ru.wikipedia.org/wiki/Max_%28%D0%BC%D0%B5%D1%81%D1%81%D0%B5%D0%BD%D0%B4%D0%B6%D0%B5%D1%80%29/)
- [topic on 4pda](https://4pda.to/forum/index.php?showtopic=1104314)
