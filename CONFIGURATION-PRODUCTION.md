# Configuration des variables d'environnement en production

## Problème

L'erreur `{"message":"No API key found in request"}` indique que les variables d'environnement Supabase ne sont pas correctement configurées en production.

## Solution

### Pour Vercel

1. Allez dans votre projet Vercel
2. Cliquez sur **Settings** → **Environment Variables**
3. Ajoutez les variables suivantes :

```
VITE_SUPABASE_URL=https://cofoqneikwdocyihzuzg.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon-ici
```

4. **Important** : Sélectionnez tous les environnements (Production, Preview, Development)
5. Redéployez votre application

### Pour Netlify

1. Allez dans votre projet Netlify
2. Cliquez sur **Site settings** → **Environment variables**
3. Ajoutez les variables :

```
VITE_SUPABASE_URL=https://cofoqneikwdocyihzuzg.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon-ici
```

4. Redéployez votre site

### Pour GitHub Pages / Autres plateformes

1. Créez un fichier `.env.production` à la racine du projet (ne le commitez PAS)
2. Ajoutez les variables :

```
VITE_SUPABASE_URL=https://cofoqneikwdocyihzuzg.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon-ici
```

3. Configurez votre pipeline de build pour utiliser ce fichier

### Pour Docker

Dans votre `Dockerfile` ou `docker-compose.yml` :

```yaml
environment:
  - VITE_SUPABASE_URL=https://cofoqneikwdocyihzuzg.supabase.co
  - VITE_SUPABASE_ANON_KEY=votre-clé-anon-ici
```

## Où trouver vos clés Supabase

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **API**
4. Copiez :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

## Vérification

Après avoir configuré les variables et redéployé :

1. Ouvrez la console du navigateur (F12)
2. Vérifiez qu'il n'y a pas d'erreur au chargement
3. Vous devriez voir : `Supabase client initialized with URL: ...`
4. Si vous voyez toujours l'erreur, vérifiez que :
   - Les variables sont bien définies (pas de typos)
   - Les variables commencent bien par `VITE_` (requis pour Vite)
   - Vous avez bien redéployé après avoir ajouté les variables

## Important : Variables VITE_

Avec Vite, seules les variables qui commencent par `VITE_` sont exposées au client. C'est pourquoi nous utilisons :
- `VITE_SUPABASE_URL` (pas `SUPABASE_URL`)
- `VITE_SUPABASE_ANON_KEY` (pas `SUPABASE_ANON_KEY`)

## Sécurité

⚠️ **Important** : La clé `anon` est publique et peut être vue dans le code source du navigateur. C'est normal et attendu pour Supabase. Les policies RLS (Row Level Security) protègent vos données.

Ne partagez JAMAIS :
- La clé `service_role` (celle-ci doit rester secrète)
- Les mots de passe de base de données
- Les tokens d'API secrets

## Dépannage

### L'erreur persiste après configuration

1. Vérifiez que les variables sont bien définies dans votre plateforme de déploiement
2. Vérifiez qu'elles commencent par `VITE_`
3. Redéployez complètement (pas juste un rebuild)
4. Videz le cache du navigateur
5. Vérifiez les logs de build pour voir si les variables sont bien injectées

### Les variables ne sont pas disponibles au runtime

Avec Vite, les variables d'environnement sont injectées au moment du **build**, pas au runtime. Si vous changez les variables, vous devez **rebuild** l'application.

### Test local

Pour tester en local avec les mêmes variables que la production :

```bash
# Créer un fichier .env.production.local
VITE_SUPABASE_URL=https://cofoqneikwdocyihzuzg.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon-ici

# Build et preview
npm run build
npm run preview
```

## Script de vérification

Ajoutez ce script dans votre `package.json` pour vérifier les variables :

```json
{
  "scripts": {
    "check-env": "node -e \"console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✓' : '✗'); console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✓' : '✗')\""
  }
}
```

Puis exécutez : `npm run check-env`

