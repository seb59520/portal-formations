// Données du jeu Format de fichiers (JSON / XML / Protobuf)
// 30+ questions réparties sur 3 niveaux de difficulté

export interface Question {
  id: string
  type: 'identify-format' | 'json-valid' | 'fix-json-mcq' | 'fix-json-editor' | 'choose-format'
  prompt: string
  snippet?: string
  options?: string[]
  answer: string | boolean
  explanation: string
  difficulty: number
}

export interface Level {
  level: number
  name: string
  questions: Question[]
}

export const formatFilesLevels: Level[] = [
  {
    level: 1,
    name: 'Découverte',
    questions: [
      {
        id: 'q1-1',
        type: 'identify-format',
        prompt: 'Quel est ce format de données ?',
        snippet: '{\n  "name": "John",\n  "age": 30\n}',
        options: ['JSON', 'XML', 'Protobuf'],
        answer: 'JSON',
        explanation: "C'est du JSON car il utilise des accolades {} et des paires clé-valeur avec des guillemets doubles.",
        difficulty: 1
      },
      {
        id: 'q1-2',
        type: 'identify-format',
        prompt: 'Quel est ce format de données ?',
        snippet: '<?xml version="1.0"?>\n<user>\n  <name>John</name>\n  <age>30</age>\n</user>',
        options: ['JSON', 'XML', 'Protobuf'],
        answer: 'XML',
        explanation: "C'est du XML car il utilise des balises <tag> et commence par <?xml version=\"1.0\"?>.",
        difficulty: 1
      },
      {
        id: 'q1-3',
        type: 'json-valid',
        prompt: 'Ce JSON est-il valide ?',
        snippet: '{"name": "John", "age": 30}',
        answer: true,
        explanation: 'Oui, c\'est un JSON valide avec une syntaxe correcte : accolades, guillemets, virgules.',
        difficulty: 1
      },
      {
        id: 'q1-4',
        type: 'json-valid',
        prompt: 'Ce JSON est-il valide ?',
        snippet: '{"name": "John", age: 30}',
        answer: false,
        explanation: 'Non, la clé "age" n\'est pas entre guillemets. En JSON, toutes les clés doivent être des strings entre guillemets.',
        difficulty: 1
      },
      {
        id: 'q1-5',
        type: 'identify-format',
        prompt: 'Quel format est le plus léger pour les APIs web modernes ?',
        options: ['JSON', 'XML', 'Protobuf'],
        answer: 'JSON',
        explanation: 'JSON est le format le plus utilisé pour les APIs web car il est léger, lisible et facile à parser.',
        difficulty: 1
      },
      {
        id: 'q1-6',
        type: 'json-valid',
        prompt: 'Ce JSON est-il valide ?',
        snippet: '{\n  "users": [\n    {"name": "John"},\n    {"name": "Jane"}\n  ]\n}',
        answer: true,
        explanation: 'Oui, c\'est un JSON valide avec un tableau d\'objets. La syntaxe est correcte.',
        difficulty: 1
      },
      {
        id: 'q1-7',
        type: 'identify-format',
        prompt: 'Quel format utilise des balises pour structurer les données ?',
        options: ['JSON', 'XML', 'Protobuf'],
        answer: 'XML',
        explanation: 'XML utilise des balises <tag> pour structurer les données, contrairement à JSON qui utilise des accolades.',
        difficulty: 1
      },
      {
        id: 'q1-8',
        type: 'json-valid',
        prompt: 'Ce JSON est-il valide ?',
        snippet: '{"name": "John", "age": 30,}',
        answer: false,
        explanation: 'Non, il y a une virgule traînante après le dernier élément. En JSON, la dernière propriété ne doit pas avoir de virgule.',
        difficulty: 1
      },
      {
        id: 'q1-9',
        type: 'identify-format',
        prompt: 'Quel format est binaire et optimisé pour la performance ?',
        options: ['JSON', 'XML', 'Protobuf'],
        answer: 'Protobuf',
        explanation: 'Protobuf (Protocol Buffers) est un format binaire sérialisé, plus compact et plus rapide que JSON ou XML.',
        difficulty: 1
      },
      {
        id: 'q1-10',
        type: 'json-valid',
        prompt: 'Ce JSON est-il valide ?',
        snippet: '{\n  "name": "John",\n  "email": "john@example.com"\n}',
        answer: true,
        explanation: 'Oui, c\'est un JSON valide avec deux propriétés correctement formatées.',
        difficulty: 1
      }
    ]
  },
  {
    level: 2,
    name: 'Intermédiaire',
    questions: [
      {
        id: 'q2-1',
        type: 'fix-json-mcq',
        prompt: 'Quelle est l\'erreur dans ce JSON ?',
        snippet: '{\n  "name": "John",\n  age: 30\n}',
        options: [
          'Manque des guillemets autour de "age"',
          'Manque une virgule',
          'Manque une accolade fermante'
        ],
        answer: 'Manque des guillemets autour de "age"',
        explanation: 'En JSON, toutes les clés doivent être entre guillemets doubles. "age" doit être écrit "age".',
        difficulty: 2
      },
      {
        id: 'q2-2',
        type: 'fix-json-mcq',
        prompt: 'Quelle est l\'erreur dans ce JSON ?',
        snippet: '{\n  "users": [\n    {"name": "John"},\n    {"name": "Jane"},\n  ]\n}',
        options: [
          'Virgule traînante dans le tableau',
          'Manque des guillemets',
          'Accolade manquante'
        ],
        answer: 'Virgule traînante dans le tableau',
        explanation: 'Il y a une virgule après le dernier élément du tableau. En JSON, les virgules traînantes ne sont pas autorisées.',
        difficulty: 2
      },
      {
        id: 'q2-3',
        type: 'choose-format',
        prompt: 'Quel format choisiriez-vous pour une API REST publique ?',
        options: ['JSON', 'XML', 'Protobuf'],
        answer: 'JSON',
        explanation: 'JSON est le standard pour les APIs REST publiques car il est lisible, léger et supporté nativement par JavaScript.',
        difficulty: 2
      },
      {
        id: 'q2-4',
        type: 'fix-json-editor',
        prompt: 'Corrigez ce JSON invalide :',
        snippet: '{\n  "name": "John"\n  "age": 30\n}',
        answer: '{\n  "name": "John",\n  "age": 30\n}',
        explanation: 'Il manquait une virgule entre les deux propriétés. En JSON, les propriétés doivent être séparées par des virgules.',
        difficulty: 2
      },
      {
        id: 'q2-5',
        type: 'choose-format',
        prompt: 'Quel format est le meilleur pour des microservices haute performance ?',
        options: ['JSON', 'XML', 'Protobuf'],
        answer: 'Protobuf',
        explanation: 'Protobuf est idéal pour les microservices car il est binaire, compact et très performant pour la sérialisation/désérialisation.',
        difficulty: 2
      },
      {
        id: 'q2-6',
        type: 'fix-json-mcq',
        prompt: 'Quelle est l\'erreur dans ce JSON ?',
        snippet: '{\n  "name": "John",\n  "hobbies": ["reading", "coding", "music",]\n}',
        options: [
          'Virgule traînante dans le tableau',
          'Guillemets manquants',
          'Accolade manquante'
        ],
        answer: 'Virgule traînante dans le tableau',
        explanation: 'Il y a une virgule après le dernier élément "music" dans le tableau. Les virgules traînantes ne sont pas autorisées en JSON.',
        difficulty: 2
      },
      {
        id: 'q2-7',
        type: 'choose-format',
        prompt: 'Quel format est le plus adapté pour des données avec schéma strict et validation ?',
        options: ['JSON', 'XML', 'Protobuf'],
        answer: 'Protobuf',
        explanation: 'Protobuf utilise des schémas stricts (.proto) qui permettent une validation forte et une évolution contrôlée des données.',
        difficulty: 2
      },
      {
        id: 'q2-8',
        type: 'fix-json-editor',
        prompt: 'Corrigez ce JSON invalide :',
        snippet: '{\n  "user": {\n    "name": "John"\n    "email": "john@example.com"\n  }\n}',
        answer: '{\n  "user": {\n    "name": "John",\n    "email": "john@example.com"\n  }\n}',
        explanation: 'Il manquait une virgule entre "name" et "email" dans l\'objet imbriqué.',
        difficulty: 2
      },
      {
        id: 'q2-9',
        type: 'json-valid',
        prompt: 'Ce JSON est-il valide ?',
        snippet: '{\n  "active": true,\n  "count": null,\n  "tags": []\n}',
        answer: true,
        explanation: 'Oui, c\'est valide. JSON supporte les booléens (true/false), null, et les tableaux vides.',
        difficulty: 2
      },
      {
        id: 'q2-10',
        type: 'fix-json-mcq',
        prompt: 'Quelle est l\'erreur dans ce JSON ?',
        snippet: '{\n  "message": "Hello "world""\n}',
        options: [
          'Guillemets échappés incorrectement',
          'Virgule manquante',
          'Accolade manquante'
        ],
        answer: 'Guillemets échappés incorrectement',
        explanation: 'Les guillemets à l\'intérieur d\'une string doivent être échappés avec un backslash : "Hello \\"world\\"".',
        difficulty: 2
      }
    ]
  },
  {
    level: 3,
    name: 'Avancé',
    questions: [
      {
        id: 'q3-1',
        type: 'choose-format',
        prompt: 'Quel format choisiriez-vous pour une API microservices haute performance avec streaming ?',
        options: ['JSON', 'XML', 'Protobuf'],
        answer: 'Protobuf',
        explanation: 'Protobuf supporte le streaming et est optimisé pour la performance, idéal pour les microservices.',
        difficulty: 3
      },
      {
        id: 'q3-2',
        type: 'fix-json-editor',
        prompt: 'Corrigez ce JSON invalide complexe :',
        snippet: '{\n  "users": [\n    {\n      "id": 1\n      "name": "John",\n      "settings": {\n        "theme": "dark"\n        "notifications": true\n      }\n    }\n  ]\n}',
        answer: '{\n  "users": [\n    {\n      "id": 1,\n      "name": "John",\n      "settings": {\n        "theme": "dark",\n        "notifications": true\n      }\n    }\n  ]\n}',
        explanation: 'Il manquait des virgules après "id": 1 et "theme": "dark". Les propriétés dans les objets imbriqués doivent aussi être séparées par des virgules.',
        difficulty: 3
      },
      {
        id: 'q3-3',
        type: 'choose-format',
        prompt: 'Quel format est le meilleur pour des données avec métadonnées et validation XSD ?',
        options: ['JSON', 'XML', 'Protobuf'],
        answer: 'XML',
        explanation: 'XML supporte les schémas XSD pour la validation stricte et permet d\'inclure des métadonnées via des attributs et namespaces.',
        difficulty: 3
      },
      {
        id: 'q3-4',
        type: 'json-valid',
        prompt: 'Ce JSON est-il valide ?',
        snippet: '{\n  "data": {\n    "nested": {\n      "deep": {\n        "value": 42\n      }\n    }\n  }\n}',
        answer: true,
        explanation: 'Oui, c\'est valide. JSON supporte l\'imbrication infinie d\'objets et de tableaux.',
        difficulty: 3
      },
      {
        id: 'q3-5',
        type: 'choose-format',
        prompt: 'Quel format est le plus adapté pour gRPC et la communication inter-services ?',
        options: ['JSON', 'XML', 'Protobuf'],
        answer: 'Protobuf',
        explanation: 'Protobuf est le format natif de gRPC, optimisé pour la communication inter-services avec typage fort et performance.',
        difficulty: 3
      },
      {
        id: 'q3-6',
        type: 'fix-json-editor',
        prompt: 'Corrigez ce JSON avec erreurs multiples :',
        snippet: '{\n  "api": "v1"\n  "endpoints": [\n    {"path": "/users", "method": "GET"}\n    {"path": "/posts", "method": "POST"}\n  ]\n}',
        answer: '{\n  "api": "v1",\n  "endpoints": [\n    {"path": "/users", "method": "GET"},\n    {"path": "/posts", "method": "POST"}\n  ]\n}',
        explanation: 'Il manquait une virgule après "api": "v1" et après le premier objet du tableau "endpoints".',
        difficulty: 3
      },
      {
        id: 'q3-7',
        type: 'choose-format',
        prompt: 'Quel format est le meilleur pour des APIs avec support multilingue et caractères spéciaux ?',
        options: ['JSON', 'XML', 'Protobuf'],
        answer: 'XML',
        explanation: 'XML gère nativement l\'encodage UTF-8 et les caractères spéciaux, avec support des entités XML pour les caractères réservés.',
        difficulty: 3
      },
      {
        id: 'q3-8',
        type: 'json-valid',
        prompt: 'Ce JSON est-il valide ?',
        snippet: '{\n  "escaped": "Line 1\\nLine 2",\n  "unicode": "\\u0041",\n  "backslash": "\\\\"\n}',
        answer: true,
        explanation: 'Oui, c\'est valide. JSON supporte les séquences d\'échappement : \\n (nouvelle ligne), \\uXXXX (unicode), \\\\ (backslash).',
        difficulty: 3
      },
      {
        id: 'q3-9',
        type: 'fix-json-editor',
        prompt: 'Corrigez ce JSON complexe avec erreurs :',
        snippet: '{\n  "config": {\n    "env": "production"\n    "debug": false\n  },\n  "features": ["auth", "logging", "cache",]\n}',
        answer: '{\n  "config": {\n    "env": "production",\n    "debug": false\n  },\n  "features": ["auth", "logging", "cache"]\n}',
        explanation: 'Il manquait une virgule après "env": "production" et il y avait une virgule traînante dans le tableau "features".',
        difficulty: 3
      },
      {
        id: 'q3-10',
        type: 'choose-format',
        prompt: 'Quel format est le plus adapté pour des données avec versioning et rétrocompatibilité ?',
        options: ['JSON', 'XML', 'Protobuf'],
        answer: 'Protobuf',
        explanation: 'Protobuf gère nativement le versioning avec des champs optionnels et des numéros de champ, permettant une évolution rétrocompatible.',
        difficulty: 3
      }
    ]
  }
]

