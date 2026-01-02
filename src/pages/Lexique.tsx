import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  ChevronDown, ChevronRight, BookOpen, Search
} from 'lucide-react'

interface Term {
  id: string
  term: string
  acronym?: string
  definition: string
  example?: string
  analogy?: string
  details?: React.ReactNode
}

export function Lexique() {
  const location = useLocation()
  // Le lexique est dans un cours si on est sur /courses/ ou /items/
  const isInCourse = location.pathname.includes('/items/') || location.pathname.includes('/courses/')
  const [openTerms, setOpenTerms] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  const toggleTerm = (id: string) => {
    const newOpen = new Set(openTerms)
    if (newOpen.has(id)) {
      newOpen.delete(id)
    } else {
      newOpen.add(id)
    }
    setOpenTerms(newOpen)
  }

  const terms: Term[] = [
    {
      id: 'api',
      term: 'API',
      acronym: 'Application Programming Interface',
      definition: 'Interface de Programmation d\'Application',
      analogy: 'Imagine un restaurant : la cuisine = le serveur/base de données (là où sont les données), le client = ton application (qui veut des données), le serveur/menu = l\'API (qui fait le lien et dit ce qui est disponible). Tu ne vas pas en cuisine prendre ton plat toi-même, tu passes par le serveur avec un menu défini.',
      details: (
        <div className="space-y-3">
          <p className="text-gray-700">
            C'est un intermédiaire qui permet à deux applications de communiquer entre elles.
          </p>
        </div>
      )
    },
    {
      id: 'client-serveur',
      term: 'Client et Serveur',
      definition: 'Les deux parties d\'une communication API',
      details: (
        <div className="space-y-3">
          <div>
            <h5 className="font-semibold text-gray-900 mb-2">Serveur</h5>
            <p className="text-gray-700">
              L'ordinateur/application qui possède les données et les fonctionnalités.
              <br />
              <span className="text-sm text-gray-600">Exemple : Les serveurs de Facebook, Google, ton backend</span>
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-gray-900 mb-2">Client</h5>
            <p className="text-gray-700">
              L'application qui demande les données.
              <br />
              <span className="text-sm text-gray-600">Exemple : Ton navigateur, ton application mobile, une app React</span>
            </p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Communication :</strong> Client → <strong>requête</strong> → Serveur → <strong>réponse</strong> → Client
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'http',
      term: 'HTTP / HTTPS',
      acronym: 'HyperText Transfer Protocol',
      definition: 'Protocole de Transfert Hypertexte - le langage de communication utilisé sur le web pour échanger des données',
      details: (
        <div className="space-y-3">
          <p className="text-gray-700">
            <strong>HTTPS</strong> = Version sécurisée (cryptée) de HTTP
          </p>
        </div>
      )
    },
    {
      id: 'methodes-http',
      term: 'Méthodes HTTP (Verbes)',
      definition: 'Les actions qu\'on peut faire sur les données',
      details: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-green-50 p-3 rounded-lg">
              <h5 className="font-semibold text-green-900 mb-1">GET</h5>
              <p className="text-sm text-green-800">Récupérer des données (lecture seule)</p>
              <code className="text-xs text-green-700 mt-1 block">GET /api/users → "Donne-moi la liste des utilisateurs"</code>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <h5 className="font-semibold text-blue-900 mb-1">POST</h5>
              <p className="text-sm text-blue-800">Créer de nouvelles données</p>
              <code className="text-xs text-blue-700 mt-1 block">POST /api/users → "Crée un nouvel utilisateur"</code>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <h5 className="font-semibold text-yellow-900 mb-1">PUT</h5>
              <p className="text-sm text-yellow-800">Remplacer complètement des données existantes</p>
              <code className="text-xs text-yellow-700 mt-1 block">PUT /api/users/123 → "Remplace toutes les infos"</code>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <h5 className="font-semibold text-purple-900 mb-1">PATCH</h5>
              <p className="text-sm text-purple-800">Modifier partiellement des données existantes</p>
              <code className="text-xs text-purple-700 mt-1 block">PATCH /api/users/123 → "Change juste l'email"</code>
            </div>
            <div className="bg-red-50 p-3 rounded-lg md:col-span-2">
              <h5 className="font-semibold text-red-900 mb-1">DELETE</h5>
              <p className="text-sm text-red-800">Supprimer des données</p>
              <code className="text-xs text-red-700 mt-1 block">DELETE /api/users/123 → "Supprime l'utilisateur 123"</code>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'endpoint',
      term: 'Endpoint (Point de terminaison)',
      definition: 'L\'URL spécifique où tu peux accéder à une ressource ou action',
      example: 'https://api.monsite.com/users',
      details: (
        <div className="space-y-3">
          <p className="text-gray-700">
            Chaque endpoint est comme une "porte" vers une fonctionnalité spécifique.
          </p>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700 mb-2"><strong>Exemples :</strong></p>
            <code className="text-xs block text-gray-600">https://api.monsite.com/users</code>
            <code className="text-xs block text-gray-600">https://api.monsite.com/products</code>
            <code className="text-xs block text-gray-600">https://api.monsite.com/orders/123</code>
          </div>
        </div>
      )
    },
    {
      id: 'requete',
      term: 'Requête (Request)',
      definition: 'Ce que le client envoie au serveur',
      details: (
        <div className="space-y-3">
          <p className="text-gray-700">
            Une requête contient :
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li><strong>Méthode</strong> : GET, POST, etc.</li>
            <li><strong>URL/Endpoint</strong> : /api/users</li>
            <li><strong>Headers</strong> : Informations supplémentaires (authentification, type de contenu)</li>
            <li><strong>Body</strong> (optionnel) : Les données envoyées (pour POST, PUT, PATCH)</li>
          </ul>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700 mb-2"><strong>Exemple de requête :</strong></p>
            <pre className="text-xs text-gray-600 overflow-x-auto">
{`POST /api/users HTTP/1.1
Host: api.monsite.com
Content-Type: application/json
Authorization: Bearer ton_token_ici

{
  "name": "Jean Dupont",
  "email": "jean@example.com"
}`}
            </pre>
          </div>
        </div>
      )
    },
    {
      id: 'reponse',
      term: 'Réponse (Response)',
      definition: 'Ce que le serveur renvoie au client',
      details: (
        <div className="space-y-3">
          <p className="text-gray-700">
            Une réponse contient :
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li><strong>Code de statut</strong> : 200, 404, 500, etc.</li>
            <li><strong>Headers</strong> : Informations sur la réponse</li>
            <li><strong>Body</strong> : Les données renvoyées (souvent en JSON)</li>
          </ul>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700 mb-2"><strong>Exemple de réponse :</strong></p>
            <pre className="text-xs text-gray-600 overflow-x-auto">
{`HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 123,
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "createdAt": "2024-01-15"
}`}
            </pre>
          </div>
        </div>
      )
    },
    {
      id: 'codes-statut',
      term: 'Codes de Statut HTTP',
      definition: 'Codes numériques qui indiquent le résultat de la requête',
      details: (
        <div className="space-y-3">
          <div className="bg-green-50 p-3 rounded-lg">
            <h5 className="font-semibold text-green-900 mb-2">2xx = Succès ✅</h5>
            <ul className="text-sm text-green-800 space-y-1">
              <li><strong>200 OK</strong> : Tout s'est bien passé</li>
              <li><strong>201 Created</strong> : Ressource créée avec succès</li>
              <li><strong>204 No Content</strong> : Succès mais pas de données à renvoyer</li>
            </ul>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <h5 className="font-semibold text-yellow-900 mb-2">4xx = Erreur du client ❌</h5>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li><strong>400 Bad Request</strong> : Requête mal formée</li>
              <li><strong>401 Unauthorized</strong> : Non authentifié</li>
              <li><strong>403 Forbidden</strong> : Pas les droits d'accès</li>
              <li><strong>404 Not Found</strong> : Ressource inexistante</li>
            </ul>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <h5 className="font-semibold text-red-900 mb-2">5xx = Erreur du serveur 💥</h5>
            <ul className="text-sm text-red-800 space-y-1">
              <li><strong>500 Internal Server Error</strong> : Erreur côté serveur</li>
              <li><strong>503 Service Unavailable</strong> : Serveur indisponible</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'json',
      term: 'JSON',
      acronym: 'JavaScript Object Notation',
      definition: 'Format de données le plus utilisé pour échanger des informations via API',
      details: (
        <div className="space-y-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700 mb-2"><strong>Exemple :</strong></p>
            <pre className="text-xs text-gray-600 overflow-x-auto">
{`{
  "id": 1,
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "age": 30,
  "active": true,
  "hobbies": ["lecture", "sport"],
  "address": {
    "city": "Paris",
    "country": "France"
  }
}`}
            </pre>
          </div>
          <div>
            <p className="text-gray-700 mb-2"><strong>Caractéristiques :</strong></p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
              <li>Facile à lire pour les humains</li>
              <li>Facile à parser pour les machines</li>
              <li>Structure avec clés/valeurs</li>
              <li>Types : string, number, boolean, array, object, null</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'headers',
      term: 'Headers (En-têtes)',
      definition: 'Informations supplémentaires envoyées avec la requête ou la réponse',
      details: (
        <div className="space-y-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700 mb-2"><strong>Headers courants :</strong></p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li><code>Content-Type: application/json</code> → Type de contenu envoyé</li>
              <li><code>Authorization: Bearer xyz123</code> → Token d'authentification</li>
              <li><code>Accept: application/json</code> → Type de contenu accepté</li>
              <li><code>User-Agent: Mozilla/5.0</code> → Information sur le client</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'body',
      term: 'Body (Corps)',
      definition: 'Les données envoyées dans une requête (POST, PUT, PATCH) ou reçues dans une réponse',
      details: (
        <div className="space-y-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700 mb-2"><strong>Exemple de body dans une requête POST :</strong></p>
            <pre className="text-xs text-gray-600 overflow-x-auto">
{`{
  "title": "Mon nouvel article",
  "content": "Contenu de l'article...",
  "author": "Sebastien"
}`}
            </pre>
          </div>
        </div>
      )
    },
    {
      id: 'ressource',
      term: 'Ressource',
      definition: 'Une entité que tu manipules via l\'API (utilisateur, produit, commande, etc.)',
      details: (
        <div className="space-y-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700 mb-2"><strong>Exemples de ressources :</strong></p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li><code>/users</code> → Collection d'utilisateurs</li>
              <li><code>/users/123</code> → Un utilisateur spécifique</li>
              <li><code>/products</code> → Collection de produits</li>
              <li><code>/orders/456</code> → Une commande spécifique</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'crud',
      term: 'CRUD',
      definition: 'Les 4 opérations de base sur les données',
      details: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">C</div>
              <div className="text-xs text-blue-800 mt-1">Create</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">R</div>
              <div className="text-xs text-green-800 mt-1">Read</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">U</div>
              <div className="text-xs text-yellow-800 mt-1">Update</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">D</div>
              <div className="text-xs text-red-800 mt-1">Delete</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'auth',
      term: 'Authentification vs Autorisation',
      definition: 'Deux concepts distincts de sécurité',
      details: (
        <div className="space-y-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <h5 className="font-semibold text-blue-900 mb-2">Authentification : "Qui es-tu ?"</h5>
            <p className="text-sm text-blue-800">
              Vérifier l'identité (login/password, token)
            </p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <h5 className="font-semibold text-green-900 mb-2">Autorisation : "Qu'as-tu le droit de faire ?"</h5>
            <p className="text-sm text-green-800">
              Vérifier les permissions (admin, user, guest)
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Exemple :</strong> Tu t'<strong>authentifies</strong> avec ton email/mot de passe.
              Le système vérifie si tu es <strong>autorisé</strong> à supprimer un produit (seul l'admin peut).
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'token',
      term: 'Token',
      definition: 'Une clé d\'accès qui prouve ton identité',
      details: (
        <div className="space-y-3">
          <p className="text-gray-700">
            Exemple : JWT (JSON Web Token)
          </p>
          <div className="bg-gray-50 p-3 rounded-lg">
            <code className="text-xs text-gray-600 break-all">
              eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyM30.abc123def456
            </code>
          </div>
          <p className="text-sm text-gray-700">
            Tu l'envoies dans le header <code className="bg-gray-100 px-1 rounded">Authorization</code> pour prouver que tu es connecté.
          </p>
        </div>
      )
    },
    {
      id: 'stateless',
      term: 'Stateless (Sans état)',
      definition: 'Le serveur ne garde aucune mémoire des requêtes précédentes',
      details: (
        <div className="space-y-3">
          <p className="text-gray-700">
            Chaque requête doit contenir <strong>toutes les informations</strong> nécessaires (notamment le token d'authentification).
          </p>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Avantage :</strong> Scalabilité, simplicité
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'api-publique-privee',
      term: 'API Publique vs Privée',
      definition: 'Deux types d\'accès aux APIs',
      details: (
        <div className="space-y-3">
          <div className="bg-green-50 p-3 rounded-lg">
            <h5 className="font-semibold text-green-900 mb-2">API Publique</h5>
            <p className="text-sm text-green-800">
              Accessible à tous (parfois avec clé API)
              <br />
              <span className="text-xs">Exemple : API météo, API Google Maps</span>
            </p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <h5 className="font-semibold text-blue-900 mb-2">API Privée</h5>
            <p className="text-sm text-blue-800">
              Accessible uniquement à ton organisation
              <br />
              <span className="text-xs">Exemple : API interne de ton entreprise</span>
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'rate-limiting',
      term: 'Rate Limiting',
      definition: 'Limitation du nombre de requêtes qu\'un client peut faire dans un temps donné',
      details: (
        <div className="space-y-3">
          <p className="text-gray-700">
            <strong>Exemple :</strong> Maximum 100 requêtes par heure
          </p>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>But :</strong> Éviter la surcharge du serveur et les abus
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'pagination',
      term: 'Pagination',
      definition: 'Découper de grandes listes de données en pages',
      details: (
        <div className="space-y-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700 mb-2"><strong>Exemples :</strong></p>
            <code className="text-xs text-gray-600 block">GET /api/users?page=1&limit=20 → Les 20 premiers utilisateurs</code>
            <code className="text-xs text-gray-600 block">GET /api/users?page=2&limit=20 → Les 20 suivants</code>
          </div>
        </div>
      )
    },
    {
      id: 'query-parameters',
      term: 'Query Parameters (Paramètres de requête)',
      definition: 'Paramètres ajoutés à l\'URL après le ? pour filtrer/modifier la requête',
      details: (
        <div className="space-y-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700 mb-2"><strong>Exemples :</strong></p>
            <code className="text-xs text-gray-600 block">/api/users?age=25&city=Paris → Filtrer</code>
            <code className="text-xs text-gray-600 block">/api/products?sort=price&order=asc → Trier</code>
            <code className="text-xs text-gray-600 block">/api/articles?page=2&limit=10 → Paginer</code>
          </div>
        </div>
      )
    },
    {
      id: 'paradigme',
      term: 'Paradigme',
      definition: 'Modèle, approche ou philosophie de conception pour développer des APIs',
      analogy: 'Un paradigme est comme une "méthode de travail" ou un "style architectural". C\'est une façon de penser et d\'organiser la communication entre applications. Chaque paradigme a ses propres règles et avantages.',
      details: (
        <div className="space-y-3">
          <p className="text-gray-700">
            En développement d'API, un paradigme définit <strong>comment</strong> les applications communiquent entre elles. 
            C'est une approche conceptuelle qui guide la structure, le format et le comportement des APIs.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-semibold text-blue-900 mb-3">Paradigmes d'API courants :</h5>
            <div className="space-y-3">
              <div className="bg-white p-3 rounded">
                <h6 className="font-semibold text-gray-900 mb-1">REST (Representational State Transfer)</h6>
                <p className="text-sm text-gray-700">
                  Utilise les méthodes HTTP (GET, POST, PUT, DELETE) et les ressources identifiées par des URLs. 
                  <br />
                  <span className="text-xs text-gray-600">Exemple : GET /api/users/123</span>
                </p>
              </div>
              <div className="bg-white p-3 rounded">
                <h6 className="font-semibold text-gray-900 mb-1">GraphQL</h6>
                <p className="text-sm text-gray-700">
                  Permet au client de demander exactement les données dont il a besoin via des queries.
                  <br />
                  <span className="text-xs text-gray-600">Exemple : query {`{ user(id: 123) { name, email } }`}</span>
                </p>
              </div>
              <div className="bg-white p-3 rounded">
                <h6 className="font-semibold text-gray-900 mb-1">RPC (Remote Procedure Call)</h6>
                <p className="text-sm text-gray-700">
                  Appelle des fonctions distantes comme si elles étaient locales.
                  <br />
                  <span className="text-xs text-gray-600">Exemple : getUserById(123)</span>
                </p>
              </div>
              <div className="bg-white p-3 rounded">
                <h6 className="font-semibold text-gray-900 mb-1">gRPC</h6>
                <p className="text-sm text-gray-700">
                  Version moderne de RPC avec typage fort et performance optimisée (utilise Protobuf).
                  <br />
                  <span className="text-xs text-gray-600">Exemple : Streaming, binaire, typé</span>
                </p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>💡 Important :</strong> Choisir un paradigme, c'est choisir une philosophie de conception. 
              Chaque paradigme a ses forces et ses faiblesses selon le contexte d'utilisation.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'polling-constant',
      term: 'Polling Constant',
      definition: 'Technique où le client interroge régulièrement le serveur pour vérifier les mises à jour',
      analogy: 'Imagine que tu vérifies toutes les 5 secondes si ton colis est arrivé, au lieu d\'attendre une notification. C\'est efficace mais peut être coûteux en ressources.',
      details: (
        <div className="space-y-3">
          <p className="text-gray-700">
            Le <strong>polling constant</strong> (ou "interrogation continue") est une technique de communication où le <strong>client</strong> 
            envoie des requêtes HTTP répétées au serveur à intervalles réguliers pour vérifier s'il y a de nouvelles données ou des mises à jour.
          </p>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-semibold text-blue-900 mb-3">Comment ça fonctionne ?</h5>
            <div className="space-y-2 text-sm text-blue-800">
              <p>1. Le client envoie une requête GET au serveur (ex: toutes les 5 secondes)</p>
              <p>2. Le serveur répond avec les données actuelles (même s'il n'y a pas de changement)</p>
              <p>3. Le client attend l'intervalle défini, puis répète le processus</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-semibold text-gray-900 mb-2">Exemple de code :</h5>
            <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`// Polling toutes les 5 secondes
setInterval(async () => {
  const response = await fetch('/api/messages');
  const data = await response.json();
  updateMessages(data);
}, 5000);`}
            </pre>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-green-50 p-3 rounded-lg">
              <h6 className="font-semibold text-green-900 mb-2">✅ Avantages</h6>
              <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                <li>Simple à implémenter</li>
                <li>Fonctionne avec tous les navigateurs</li>
                <li>Pas besoin de connexion persistante</li>
                <li>Compatible avec les proxies et firewalls</li>
              </ul>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <h6 className="font-semibold text-red-900 mb-2">❌ Inconvénients</h6>
              <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                <li>Consomme beaucoup de bande passante</li>
                <li>Charge inutile sur le serveur</li>
                <li>Délai de latence (jusqu'à l'intervalle)</li>
                <li>Peut être inefficace pour les mises à jour rares</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h5 className="font-semibold text-yellow-900 mb-2">Alternatives au polling constant :</h5>
            <div className="space-y-2 text-sm text-yellow-800">
              <p>
                <strong>WebSockets :</strong> Connexion bidirectionnelle persistante, mise à jour en temps réel
                <br />
                <span className="text-xs text-yellow-700">→ Meilleur pour les applications temps réel (chat, jeux)</span>
              </p>
              <p>
                <strong>Server-Sent Events (SSE) :</strong> Le serveur pousse les données au client
                <br />
                <span className="text-xs text-yellow-700">→ Idéal pour les notifications et mises à jour unidirectionnelles</span>
              </p>
              <p>
                <strong>Long Polling :</strong> Le serveur garde la requête ouverte jusqu'à ce qu'il y ait une mise à jour
                <br />
                <span className="text-xs text-yellow-700">→ Compromis entre polling et WebSockets</span>
              </p>
            </div>
          </div>

          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-sm text-purple-800">
              <strong>💡 Quand utiliser le polling constant ?</strong> Pour des mises à jour peu fréquentes 
              (ex: vérifier le statut d'une commande toutes les 30 secondes) ou quand les alternatives 
              ne sont pas disponibles.
            </p>
          </div>
        </div>
      )
    }
  ]

  const filteredTerms = terms.filter(term => 
    term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
    term.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (term.acronym && term.acronym.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className={isInCourse ? 'h-full' : 'min-h-screen bg-gray-50'}>
      {/* Header - seulement si pas dans un cours ou item */}
      {!isInCourse && (
        <header className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Link
                  to="/app"
                  className="text-blue-600 hover:text-blue-500"
                >
                  ← Retour
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                    Lexique API
                  </h1>
                  <p className="text-sm text-gray-600">Termes fondamentaux sur les APIs</p>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className={isInCourse ? 'py-0' : 'max-w-4xl mx-auto py-6 sm:px-6 lg:px-8'}>
        <div className={isInCourse ? '' : 'px-4 py-6 sm:px-0'}>
          {/* Search bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un terme..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {searchQuery && (
              <p className="mt-2 text-sm text-gray-600">
                {filteredTerms.length} {filteredTerms.length === 1 ? 'terme trouvé' : 'termes trouvés'}
              </p>
            )}
          </div>

          {/* Terms list */}
          <div className="bg-white rounded-lg shadow">
            <div className="divide-y divide-gray-200">
              {filteredTerms.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">Aucun terme trouvé pour "{searchQuery}"</p>
                </div>
              ) : (
                filteredTerms.map((term) => {
                  const isOpen = openTerms.has(term.id)
                  return (
                    <div key={term.id} className="p-6">
                      <button
                        onClick={() => toggleTerm(term.id)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-lg font-semibold text-gray-900">
                              {term.term}
                            </h2>
                            {term.acronym && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {term.acronym}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{term.definition}</p>
                        </div>
                        {isOpen ? (
                          <ChevronDown className="w-5 h-5 text-gray-500 ml-4 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500 ml-4 flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="mt-4 pl-0">
                          {term.analogy && (
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-r">
                              <p className="text-sm text-blue-900">
                                <strong>💡 Analogie :</strong> {term.analogy}
                              </p>
                            </div>
                          )}
                          {term.details}
                          {term.example && (
                            <div className="bg-gray-50 p-3 rounded-lg mt-3">
                              <p className="text-sm text-gray-700 mb-1"><strong>Exemple :</strong></p>
                              <code className="text-xs text-gray-600">{term.example}</code>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Visual summary */}
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Résumé visuel d'une communication API
            </h3>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="space-y-2 text-sm font-mono">
                <div className="text-blue-600 font-semibold">CLIENT (React App)</div>
                <div className="text-gray-500">    ↓</div>
                <div className="bg-gray-50 p-2 rounded text-xs">
                  <div>[Requête HTTP]</div>
                  <div className="ml-2">- Méthode: POST</div>
                  <div className="ml-2">- Endpoint: /api/users</div>
                  <div className="ml-2">- Headers: Authorization, Content-Type</div>
                  <div className="ml-2">- Body: {"{"}"name": "Jean", "email": "jean@test.fr"{"}"}</div>
                </div>
                <div className="text-gray-500">    ↓</div>
                <div className="text-purple-600 font-semibold">SERVEUR (Node.js/Express)</div>
                <div className="bg-gray-50 p-2 rounded text-xs ml-4">
                  <div>- Reçoit la requête</div>
                  <div>- Vérifie l'authentification</div>
                  <div>- Traite les données</div>
                  <div>- Accède à la base de données</div>
                </div>
                <div className="text-gray-500">    ↓</div>
                <div className="bg-gray-50 p-2 rounded text-xs">
                  <div>[Réponse HTTP]</div>
                  <div className="ml-2">- Code: 201 Created</div>
                  <div className="ml-2">- Headers: Content-Type</div>
                  <div className="ml-2">- Body: {"{"}"id": 123, "name": "Jean"{"}"}</div>
                </div>
                <div className="text-gray-500">    ↓</div>
                <div className="text-blue-600 font-semibold">CLIENT</div>
                <div className="bg-gray-50 p-2 rounded text-xs ml-4">- Affiche le résultat</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

