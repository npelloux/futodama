# Mise à jour automatique du serveur (Watchtower)

Chaque push sur `main` publie l'image `ghcr.io/npelloux/futodama:latest`, mais le
serveur ne la reprend pas tout seul : il faut `docker compose pull` puis
`docker compose up -d`. Watchtower fait ces deux gestes à notre place.

## Principe

Watchtower est un conteneur qui a accès au démon Docker du serveur. À
intervalle régulier, pour chaque conteneur qu'on lui a confié, il compare le
condensat (digest) de l'image qui tourne avec celui que le registre publie pour
le même tag. S'ils diffèrent, il tire la nouvelle image, arrête le conteneur,
le recrée à l'identique (mêmes variables, volumes, réseaux et labels Traefik)
avec la nouvelle image, puis supprime l'ancienne.

Le mode `--label-enable` limite son action aux conteneurs portant le label
`com.centurylinklabs.watchtower.enable=true` : Traefik, Authelia et les autres
services du serveur ne sont jamais touchés.

## Service à ajouter au compose du serveur

```yaml
services:
  watchtower:
    image: containrrr/watchtower:1.7.1
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      # Nécessaire seulement si une image surveillée est privée sur ghcr.io :
      # - /root/.docker/config.json:/config.json:ro
    environment:
      TZ: Europe/Paris
    # Vérifie toutes les 5 minutes, ne touche qu'aux conteneurs labellisés,
    # supprime les anciennes images après remplacement.
    command: --label-enable --cleanup --interval 300
```

## Label à poser sur chaque service à suivre

```yaml
  futodama:
    image: ghcr.io/npelloux/futodama:latest
    labels:
      - com.centurylinklabs.watchtower.enable=true
      # ... labels Traefik existants, inchangés
```

Le même label sur `kanban`, `aelworks`, `kokaji` ou `sdeg` les met sous
surveillance ; sans label, rien ne change pour eux.

## Mise en place

```bash
cd <dossier-du-projet-compose>
docker compose up -d watchtower futodama
docker logs -f watchtower
```

Le journal montre chaque vérification et chaque remplacement
(`Found new ghcr.io/npelloux/futodama:latest image`, puis `Stopping`,
`Creating`). Le délai entre la fin du workflow GitHub et la mise à jour en ligne
est d'au plus 5 minutes ; il peut être réduit avec `--interval 60`, au prix
d'un appel au registre par minute.

## Limites et précautions

- Une mise à jour recrée le conteneur : quelques secondes d'indisponibilité,
  invisibles pour une page statique derrière Traefik.
- Watchtower suit le **tag** `latest` : si le workflow échoue, aucune image
  n'est publiée et rien ne change en ligne, ce qui est le comportement voulu.
- Si `docker compose pull` demande une authentification (image privée sur
  ghcr.io), faire `docker login ghcr.io` sur le serveur avec un token GitHub
  ayant le droit `read:packages`, puis monter le `config.json` comme indiqué.
- Pour revenir en arrière : `docker compose pull` n'est plus utile, il suffit
  de fixer l'image sur un condensat précis (`ghcr.io/npelloux/futodama@sha256:…`,
  visible dans le journal du workflow) et de relancer `docker compose up -d` ;
  Watchtower ne remplace pas un conteneur épinglé sur un condensat.

## Consignes pour un agent (Claude Code) sur le serveur

Texte à lui donner tel quel, à lancer depuis le dossier du projet compose :

> Mets en place Watchtower pour que le service `futodama` (image
> `ghcr.io/npelloux/futodama:latest`) soit mis à jour automatiquement.
>
> 1. Trouve le fichier compose qui définit `futodama` dans ce dossier
>    (`docker compose config --services` doit le lister). Ne touche à rien
>    d'autre dans ce fichier que ce qui est décrit ici.
> 2. Ajoute un service `watchtower` : image `containrrr/watchtower:1.7.1`,
>    `restart: unless-stopped`, volume `/var/run/docker.sock:/var/run/docker.sock`,
>    variable `TZ=Europe/Paris`, commande `--label-enable --cleanup --interval 300`.
> 3. Ajoute le label `com.centurylinklabs.watchtower.enable=true` au seul
>    service `futodama`. N'active pas Watchtower sur Traefik, Authelia ni sur
>    les autres services.
> 4. Vérifie le fichier avec `docker compose config` avant de lancer quoi que
>    ce soit, puis `docker compose up -d watchtower futodama`.
> 5. Contrôle : `docker logs watchtower` doit montrer une première vérification
>    sans erreur, et `curl -s https://futodama.aelworks.fr/` doit toujours
>    répondre la page. Si `docker compose pull futodama` demande une
>    authentification, arrête-toi et dis-le-moi : il faudra un
>    `docker login ghcr.io` et monter `~/.docker/config.json` dans Watchtower.
> 6. Montre-moi le diff du fichier compose et la sortie des commandes. Ne
>    redémarre aucun autre conteneur, ne supprime aucune image à la main.
