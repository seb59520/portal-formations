# Correction du problème de cache en production

## Problème

En production, il faut vider le cache du navigateur pour que les nouvelles versions fonctionnent correctement.

## Solutions implémentées

### 1. Headers de cache pour index.html

**Fichiers modifiés** :
- `index.html` : Ajout de meta tags pour empêcher le cache
- `netlify.toml` : Headers pour empêcher le cache de index.html
- `vercel.json` : Headers pour empêcher le cache de index.html

**Résultat** : `index.html` n'est jamais mis en cache, garantissant que les utilisateurs obtiennent toujours la dernière version.

### 2. Cache busting avec hash dans les noms de fichiers

**Fichier modifié** : `vite.config.ts`

```typescript
build: {
  rollupOptions: {
    output: {
      entryFileNames: `assets/[name]-[hash].js`,
      chunkFileNames: `assets/[name]-[hash].js`,
      assetFileNames: `assets/[name]-[hash].[ext]`,
    },
  },
}
```

**Résultat** : Chaque build génère des noms de fichiers uniques avec un hash. Si le contenu change, le hash change, forçant le navigateur à télécharger la nouvelle version.

### 3. Détection automatique de nouvelle version

**Fichier modifié** : `src/main.tsx`

L'application vérifie automatiquement toutes les 5 minutes si une nouvelle version est disponible en comparant les headers `Last-Modified` et `ETag` de `index.html`.

**Résultat** : Les utilisateurs obtiennent automatiquement la nouvelle version sans avoir à vider le cache manuellement.

### 4. Configuration des headers de cache

**Assets statiques** (JS, CSS avec hash) :
- Cache : `public, max-age=31536000, immutable`
- Ces fichiers peuvent être mis en cache indéfiniment car leur nom change à chaque build

**index.html** :
- Cache : `no-cache, no-store, must-revalidate`
- Ce fichier ne doit jamais être mis en cache

## Comment ça fonctionne

1. **Au build** : Vite génère des fichiers avec des noms uniques (hash)
   - `main-abc123.js` → `main-xyz789.js` (si le contenu change)

2. **Au chargement** : Le navigateur charge `index.html` (jamais en cache)
   - `index.html` référence les nouveaux fichiers avec hash

3. **Détection automatique** : Toutes les 5 minutes, l'app vérifie si `index.html` a changé
   - Si oui → rechargement automatique

## Avantages

✅ **Plus besoin de vider le cache manuellement**
✅ **Mises à jour automatiques pour les utilisateurs**
✅ **Performance optimale** : les assets sont mis en cache, seul `index.html` est rechargé
✅ **Compatibilité** : Fonctionne avec Netlify, Vercel, et autres plateformes

## Configuration requise

### Pour Netlify

Le fichier `netlify.toml` est déjà configuré avec les bons headers.

### Pour Vercel

Le fichier `vercel.json` est déjà configuré avec les bons headers.

### Pour d'autres plateformes

Assurez-vous que :
1. `index.html` a les headers : `Cache-Control: no-cache, no-store, must-revalidate`
2. Les assets dans `/assets/*` ont les headers : `Cache-Control: public, max-age=31536000, immutable`

## Test

1. Déployez une nouvelle version
2. Attendez 5 minutes (ou rechargez manuellement)
3. L'application devrait automatiquement détecter et charger la nouvelle version

## Dépannage

### Le cache persiste encore

1. Vérifiez que `index.html` a bien les headers `no-cache`
2. Vérifiez que les fichiers assets ont bien un hash dans leur nom
3. Videz le cache du navigateur une dernière fois (Ctrl+Shift+R ou Cmd+Shift+R)

### La détection automatique ne fonctionne pas

1. Vérifiez la console du navigateur pour les erreurs
2. Vérifiez que le serveur envoie bien les headers `Last-Modified` ou `ETag`
3. La vérification se fait toutes les 5 minutes, soyez patient

### Les assets ne se rechargent pas

1. Vérifiez que les noms de fichiers contiennent bien un hash
2. Vérifiez que `index.html` référence bien les nouveaux fichiers
3. Videz le cache du navigateur

## Notes importantes

- La détection automatique fonctionne seulement en production (`import.meta.env.PROD`)
- En développement, le HMR (Hot Module Replacement) gère déjà les mises à jour
- Les utilisateurs qui ont l'application ouverte recevront la mise à jour automatiquement dans les 5 minutes
- Pour forcer une mise à jour immédiate, les utilisateurs peuvent recharger la page (F5 ou Ctrl+R)

