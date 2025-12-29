import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  BookOpen, FileText, Presentation, PenTool, Code, Gamepad2, 
  ChevronDown, ChevronRight, HelpCircle, Settings, Layout, 
  FileCheck, List, AlignLeft, Palette, ZoomIn
} from 'lucide-react'

interface HelpSection {
  id: string
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

export function Help() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['overview']))

  const toggleSection = (id: string) => {
    const newOpen = new Set(openSections)
    if (newOpen.has(id)) {
      newOpen.delete(id)
    } else {
      newOpen.add(id)
    }
    setOpenSections(newOpen)
  }

  const sections: HelpSection[] = [
    {
      id: 'overview',
      title: 'Vue d\'ensemble',
      icon: <HelpCircle className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Le Portail Formations vous permet de créer et gérer des contenus pédagogiques structurés.
            Vous pouvez créer des formations avec différents types de contenus : ressources, supports, exercices, TPs et mini-jeux.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Workflow de base</h4>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Créer une formation</li>
              <li>Ajouter des modules</li>
              <li>Ajouter des éléments dans les modules</li>
              <li>Sauvegarder la formation</li>
              <li>Modifier les éléments pour ajouter du contenu</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'resource',
      title: 'Ressource',
      icon: <FileText className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Qu'est-ce qu'une ressource ?</h4>
            <p className="text-gray-700">
              Une ressource est un document, un lien ou un fichier que les étudiants peuvent télécharger ou consulter.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Quand l'utiliser ?</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Documents de référence (PDF, Word, etc.)</li>
              <li>Liens vers des sites web externes</li>
              <li>Fichiers à télécharger</li>
              <li>Documentation complémentaire</li>
              <li>Articles, guides, tutoriels</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Comment créer ?</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>Créez un élément de type "Ressource" dans un module</li>
              <li>Donnez un titre et une description</li>
              <li>Ajoutez une URL externe OU uploadez un fichier</li>
              <li>Sauvegardez la formation, puis modifiez l'élément pour ajouter du contenu</li>
            </ol>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Affichage :</strong> Les étudiants verront un bouton pour télécharger le fichier ou accéder au lien.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'slide',
      title: 'Support projeté',
      icon: <Presentation className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Qu'est-ce qu'un support projeté ?</h4>
            <p className="text-gray-700">
              Un support projeté est un document visuel (PDF, image) optimisé pour la projection ou la visualisation directe.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Quand l'utiliser ?</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Présentations PowerPoint converties en PDF</li>
              <li>Slides de cours</li>
              <li>Supports visuels pour présentation</li>
              <li>Images pédagogiques</li>
              <li>Documents à projeter en classe</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Différence avec Ressource</h4>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Ressource :</strong> Fichier à télécharger<br />
                <strong>Support :</strong> Document à visualiser directement (avec visualiseur PDF intégré)
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'exercise',
      title: 'Exercice',
      icon: <PenTool className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Qu'est-ce qu'un exercice ?</h4>
            <p className="text-gray-700">
              Un exercice est une question ou un problème que les étudiants doivent résoudre et soumettre.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Quand l'utiliser ?</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Questions à réponse courte</li>
              <li>Problèmes à résoudre</li>
              <li>Quiz</li>
              <li>Questions de compréhension</li>
              <li>Exercices pratiques</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Fonctionnement</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>L'étudiant voit l'énoncé (éditeur de texte riche)</li>
              <li>Il tape sa réponse dans le champ texte</li>
              <li>Il soumet sa réponse</li>
              <li>Une fois noté, il peut voir la correction</li>
            </ol>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Astuce :</strong> Utilisez l'éditeur de texte riche pour créer des énoncés avec des formules, des images, etc.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'tp',
      title: 'Travaux pratiques',
      icon: <Code className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Qu'est-ce qu'un TP ?</h4>
            <p className="text-gray-700">
              Un TP est un travail pratique plus complexe qui peut inclure des fichiers à soumettre.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Quand l'utiliser ?</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Projets pratiques</li>
              <li>Travaux à rendre avec fichiers</li>
              <li>Devoirs complexes</li>
              <li>Projets de groupe</li>
              <li>Travaux avec livrables</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Fonctionnement</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>L'étudiant voit les instructions et la checklist</li>
              <li>Il décrit son travail dans le champ texte</li>
              <li>Il peut uploader un fichier (PDF, DOC, ZIP, etc.)</li>
              <li>Il soumet son travail</li>
              <li>Une fois noté, il voit sa note</li>
            </ol>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-800">
              <strong>Types de fichiers acceptés :</strong> PDF, DOC, DOCX, ZIP, RAR, images (JPG, PNG)
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'game',
      title: 'Mini-jeu',
      icon: <Gamepad2 className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Qu'est-ce qu'un mini-jeu ?</h4>
            <p className="text-gray-700">
              Un mini-jeu est une activité ludique interactive pour renforcer l'apprentissage.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Quand l'utiliser ?</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Quiz interactifs</li>
              <li>Jeux éducatifs</li>
              <li>Activités ludiques</li>
              <li>Renforcement de l'apprentissage</li>
              <li>Évaluation gamifiée</li>
            </ul>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Note :</strong> Les scores sont enregistrés automatiquement. Les étudiants peuvent voir leur progression.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'editor',
      title: 'Éditeur de texte riche',
      icon: <Layout className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Fonctionnalités disponibles</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <h5 className="font-medium mb-2">Formatage de base</h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• <strong>Gras</strong> : Mettre en évidence</li>
                  <li>• <em>Italique</em> : Mettre en emphase</li>
                  <li>• Titres H1, H2, H3</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <h5 className="font-medium mb-2">Listes</h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Liste à puces</li>
                  <li>• Liste numérotée</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <h5 className="font-medium mb-2">Mise en page</h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Alignement (gauche, centre, droite, justifié)</li>
                  <li>• Couleur du texte</li>
                  <li>• Liens</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <h5 className="font-medium mb-2">Navigation</h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Annuler / Refaire</li>
                </ul>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Conseils d'utilisation</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Utilisez les titres (H1, H2, H3) pour créer une hiérarchie</li>
              <li>Séparez les paragraphes avec des sauts de ligne</li>
              <li>Utilisez le <strong>gras</strong> pour les mots-clés</li>
              <li>Utilisez l'<em>italique</em> pour les termes techniques</li>
              <li>Organisez avec des listes pour énumérer</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'chapters',
      title: 'Système de chapitres',
      icon: <BookOpen className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Qu'est-ce qu'un chapitre ?</h4>
            <p className="text-gray-700">
              Un chapitre est une section structurée à l'intérieur d'un élément (leçon). Il permet de diviser le contenu en parties logiques.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Comment créer des chapitres ?</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>Dans l'édition d'un élément, allez dans la section "Chapitres"</li>
              <li>Cliquez sur "Ajouter un chapitre"</li>
              <li>Donnez un titre et écrivez le contenu avec l'éditeur</li>
              <li>Réorganisez avec les flèches haut/bas</li>
            </ol>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Affichage :</strong> Les chapitres s'affichent sous forme d'accordéon. Les étudiants cliquent sur un chapitre pour l'ouvrir.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'settings',
      title: 'Paramètres et fonctionnalités',
      icon: <Settings className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Zoom PDF</h4>
            <div className="flex items-start space-x-2">
              <ZoomIn className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-gray-700 mb-2">
                  Le niveau de zoom des PDFs est sauvegardé automatiquement :
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Choisissez votre niveau de zoom (50%, 75%, 100%, 125%, 150%, 200%)</li>
                  <li>Votre préférence est enregistrée</li>
                  <li>Le zoom est restauré à chaque ouverture de PDF</li>
                </ul>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Tuiles de fonctionnalités</h4>
            <p className="text-gray-700 mb-2">
              Sur la page d'une formation, vous trouverez des tuiles pour filtrer le contenu :
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div className="bg-blue-50 p-2 rounded">Vue d'ensemble</div>
              <div className="bg-blue-50 p-2 rounded">Ressources</div>
              <div className="bg-green-50 p-2 rounded">Supports</div>
              <div className="bg-yellow-50 p-2 rounded">Exercices</div>
              <div className="bg-purple-50 p-2 rounded">Travaux pratiques</div>
              <div className="bg-red-50 p-2 rounded">Mini-jeux</div>
            </div>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
                <h1 className="text-2xl font-bold text-gray-900">Aide et documentation</h1>
                <p className="text-sm text-gray-600">Guide complet d'utilisation du portail</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow">
            <div className="divide-y divide-gray-200">
              {sections.map((section) => {
                const isOpen = openSections.has(section.id)
                return (
                  <div key={section.id} className="p-6">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-blue-600">
                          {section.icon}
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {section.title}
                        </h2>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="mt-4 pl-8">
                        {section.content}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Lien vers la documentation complète */}
          <div className="mt-6 bg-blue-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Documentation complète
            </h3>
            <p className="text-blue-800 mb-4">
              Pour plus de détails, consultez le guide complet dans le fichier GUIDE-AIDE.md
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <span className="bg-white px-3 py-1 rounded">Création de formations</span>
              <span className="bg-white px-3 py-1 rounded">Gestion des modules</span>
              <span className="bg-white px-3 py-1 rounded">Édition de contenu</span>
              <span className="bg-white px-3 py-1 rounded">Bonnes pratiques</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

