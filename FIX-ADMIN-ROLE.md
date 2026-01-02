# Correction du rôle Admin

## Problème
Votre utilisateur est défini comme admin dans la base de données mais apparaît comme étudiant dans l'application.

## Solutions

### Solution 1 : Vérifier et corriger via SQL (Recommandé)

1. **Connectez-vous à Supabase** et allez dans l'éditeur SQL

2. **Trouvez votre User ID** :
```sql
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;
```

3. **Vérifiez votre profil actuel** (remplacez `VOTRE_USER_ID` par votre ID) :
```sql
SELECT id, role, full_name, created_at 
FROM profiles 
WHERE id = 'VOTRE_USER_ID';
```

4. **Mettez à jour le rôle en admin** :
```sql
UPDATE profiles 
SET role = 'admin'
WHERE id = 'VOTRE_USER_ID';
```

5. **Vérifiez que ça a fonctionné** :
```sql
SELECT id, role, full_name, created_at 
FROM profiles 
WHERE id = 'VOTRE_USER_ID';
```

6. **Si le profil n'existe pas**, créez-le :
```sql
INSERT INTO profiles (id, role, full_name)
VALUES (
  'VOTRE_USER_ID',
  'admin',
  'Votre Nom'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
```

### Solution 2 : Utiliser la page de débogage

1. **Accédez à la page de débogage** : `/debug-profile`
   - Cette page affiche toutes les informations sur votre profil
   - Elle compare le profil dans le contexte React avec celui de la base de données
   - Elle permet de forcer la mise à jour du rôle

2. **Actions disponibles** :
   - **Rafraîchir depuis la DB** : Recharge le profil depuis la base de données
   - **Rafraîchir le contexte** : Met à jour le contexte React
   - **Forcer le rôle à 'admin'** : Met à jour directement le rôle dans la DB

3. **Après avoir mis à jour** :
   - Cliquez sur "Rafraîchir le contexte"
   - Rechargez la page (F5)
   - Déconnectez-vous et reconnectez-vous si nécessaire

### Solution 3 : Utiliser le script SQL fourni

Un fichier `fix-admin-role.sql` a été créé avec toutes les requêtes nécessaires. Ouvrez-le et suivez les instructions étape par étape.

## Vérification

Après avoir appliqué une solution :

1. **Déconnectez-vous** de l'application
2. **Reconnectez-vous**
3. **Vérifiez votre profil** : `/profile`
4. **Vérifiez que vous avez accès** à `/admin`

## Causes possibles

1. **Le trigger automatique** : Lors de la création d'un utilisateur, un trigger crée automatiquement un profil avec le rôle 'student'. Si vous avez créé votre compte normalement, le profil a été créé avec 'student'.

2. **Le profil n'existe pas** : Si le profil n'existe pas dans la table `profiles`, l'application ne peut pas déterminer votre rôle.

3. **Cache du navigateur** : Parfois, le navigateur peut mettre en cache l'ancien profil.

## Prévention

Pour éviter ce problème à l'avenir :

1. **Créez d'abord l'utilisateur dans auth.users**
2. **Créez ensuite le profil avec le bon rôle** :
```sql
INSERT INTO profiles (id, role, full_name)
VALUES ('user_id', 'admin', 'Nom Admin');
```

Ou utilisez le script `create-admin-profile.sql` fourni.

## Debug

Si le problème persiste :

1. Ouvrez la console du navigateur (F12)
2. Regardez les logs qui commencent par "Profile fetched successfully"
3. Vérifiez que le rôle affiché est bien 'admin'
4. Utilisez la page `/debug-profile` pour voir toutes les informations

