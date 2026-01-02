import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';
import { CourseJson } from '../../types/courseJson';
import { Course, Module, Item } from '../../types/database';
import { 
  BookOpen, 
  Clock, 
  Target, 
  MessageSquare, 
  Lightbulb, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Download,
  Printer,
  Eye,
  ArrowLeft
} from 'lucide-react';

interface ScriptSection {
  title: string;
  type: 'introduction' | 'content' | 'exercise' | 'transition' | 'summary';
  content: string;
  keyPoints: string[];
  arguments: string[];
  sources: string[];
  questions: string[];
  examples: string[];
  estimatedTime: number; // en minutes
  order: number;
}

export function TrainerCourseScript() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [courseJson, setCourseJson] = useState<CourseJson | null>(null);
  const [scriptSections, setScriptSections] = useState<ScriptSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    if (courseId && user) {
      fetchCourse();
    }
  }, [courseId, user]);

  const fetchCourse = async () => {
    try {
      setError('');
      setLoading(true);

      // Récupérer le cours
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Récupérer les modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('position', { ascending: true });

      if (modulesError) throw modulesError;

      // Récupérer les items
      const moduleIds = modulesData?.map(m => m.id) || [];
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .in('module_id', moduleIds)
        .order('position', { ascending: true });

      if (itemsError) throw itemsError;

      // Récupérer les chapitres
      const itemIds = itemsData?.map(i => i.id) || [];
      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('*')
        .in('item_id', itemIds)
        .order('position', { ascending: true });

      // Construire le CourseJson
      const modulesWithItems = (modulesData || []).map(module => ({
        ...module,
        items: (itemsData || []).filter(item => item.module_id === module.id)
      }));

      const chaptersMap = new Map<string, any[]>();
      (chaptersData || []).forEach(ch => {
        if (!chaptersMap.has(ch.item_id)) {
          chaptersMap.set(ch.item_id, []);
        }
        chaptersMap.get(ch.item_id)!.push({
          title: ch.title,
          position: ch.position,
          content: ch.content,
          type: ch.type,
          game_content: ch.game_content,
          published: ch.published
        });
      });

      const courseJsonData: CourseJson = {
        title: courseData.title,
        description: courseData.description || '',
        status: courseData.status as 'draft' | 'published',
        access_type: courseData.access_type as 'free' | 'paid' | 'invite',
        price_cents: courseData.price_cents || undefined,
        currency: courseData.currency || undefined,
        modules: modulesWithItems.map(module => ({
          title: module.title,
          position: module.position,
          items: module.items.map(item => ({
            id: item.id,
            type: item.type as 'resource' | 'slide' | 'exercise' | 'tp' | 'game',
            title: item.title,
            position: item.position,
            published: item.published,
            content: item.content || {},
            asset_path: item.asset_path || undefined,
            external_url: item.external_url || undefined,
            chapters: chaptersMap.get(item.id) || undefined
          }))
        }))
      };

      setCourseJson(courseJsonData);
      generateScript(courseJsonData);
    } catch (error: any) {
      console.error('Error fetching course:', error);
      setError('Erreur lors du chargement du cours.');
    } finally {
      setLoading(false);
    }
  };

  const generateScript = (courseJson: CourseJson) => {
    const sections: ScriptSection[] = [];
    let order = 0;
    let totalMinutes = 0;

    // Introduction générale du cours
    sections.push({
      title: `Introduction - ${courseJson.title}`,
      type: 'introduction',
      content: courseJson.description || `Bienvenue dans le cours "${courseJson.title}". Ce cours a été conçu pour vous permettre d'acquérir des compétences essentielles dans ce domaine. Nous allons explorer les concepts fondamentaux, les techniques pratiques, et les applications concrètes qui vous seront utiles dans votre contexte professionnel.`,
      keyPoints: extractKeyPoints(courseJson.description || '').length > 0 
        ? extractKeyPoints(courseJson.description || '')
        : [
          'Comprendre les objectifs pédagogiques du cours',
          'Identifier les compétences à acquérir',
          'Connaître la structure et l\'organisation du parcours',
          'Définir les attentes et les prérequis'
        ],
      arguments: [
        'Une introduction claire permet de poser le cadre et de motiver les apprenants',
        'La définition des objectifs facilite l\'engagement et la compréhension des enjeux',
        'La présentation de la structure aide à se repérer dans le parcours'
      ],
      sources: [],
      questions: [
        'Quelles sont vos attentes pour ce cours ?',
        'Avez-vous déjà des connaissances sur ce sujet ? Si oui, lesquelles ?',
        'Quels sont les défis que vous souhaitez relever grâce à ce cours ?',
        'Comment envisagez-vous d\'appliquer les connaissances acquises ?'
      ],
      examples: [],
      estimatedTime: 10,
      order: order++
    });
    totalMinutes += 10;

    // Parcourir chaque module
    courseJson.modules.forEach((module, moduleIndex) => {
      // Introduction du module
      sections.push({
        title: `Module ${moduleIndex + 1}: ${module.title}`,
        type: 'introduction',
        content: `Nous allons maintenant aborder le module "${module.title}". Ce module est essentiel car il constitue une étape fondamentale dans votre apprentissage. Il va vous permettre de développer des compétences pratiques et théoriques qui seront directement applicables dans votre contexte professionnel.`,
        keyPoints: [
          `Comprendre les concepts clés et les fondements théoriques de ${module.title}`,
          `Maîtriser les techniques, méthodes et outils associés`,
          `Appliquer les connaissances acquises dans des situations concrètes`,
          `Identifier les bonnes pratiques et éviter les erreurs courantes`
        ],
        arguments: [
          `Ce module s'appuie sur les connaissances acquises précédemment et prépare les modules suivants`,
          `Les concepts abordés sont directement applicables dans un contexte professionnel`,
          `La maîtrise de ce module est essentielle pour la suite du parcours`
        ],
        sources: [],
        questions: [
          `Que savez-vous déjà sur ${module.title} ?`,
          `Quels sont les défis que vous rencontrez ou anticipez dans ce domaine ?`,
          `Quelles sont vos attentes pour ce module ?`,
          `Avez-vous déjà eu l'occasion d'appliquer ces concepts ?`
        ],
        examples: [],
        estimatedTime: 5,
        order: order++
      });
      totalMinutes += 5;

      // Parcourir chaque item du module
      module.items.forEach((item, itemIndex) => {
        const itemContent = extractItemContent(item);
        
        // Section principale pour l'item
        sections.push({
          title: `${item.title}`,
          type: item.type === 'exercise' || item.type === 'tp' ? 'exercise' : 'content',
          content: itemContent.mainContent,
          keyPoints: itemContent.keyPoints,
          arguments: itemContent.arguments,
          sources: itemContent.sources,
          questions: itemContent.questions,
          examples: itemContent.examples,
          estimatedTime: estimateTimeForItem(item),
          order: order++
        });
        totalMinutes += estimateTimeForItem(item);

        // Traiter les chapitres si présents
        if (item.chapters && item.chapters.length > 0) {
          item.chapters.forEach((chapter, chapterIndex) => {
            const chapterContent = extractChapterContent(chapter);
            sections.push({
              title: `${item.title} - ${chapter.title}`,
              type: 'content',
              content: chapterContent.mainContent,
              keyPoints: chapterContent.keyPoints,
              arguments: chapterContent.arguments,
              sources: chapterContent.sources,
              questions: chapterContent.questions,
              examples: chapterContent.examples,
              estimatedTime: 5, // Estimation par défaut pour un chapitre
              order: order++
            });
            totalMinutes += 5;
          });
        }

        // Transition entre items (sauf pour le dernier)
        if (itemIndex < module.items.length - 1) {
          sections.push({
            title: `Transition vers ${module.items[itemIndex + 1].title}`,
            type: 'transition',
            content: `Maintenant que nous avons couvert ${item.title}, nous allons passer à ${module.items[itemIndex + 1].title}. Cette transition est logique car les concepts que nous venons d'aborder vont nous permettre de comprendre et d'appliquer les éléments suivants. Il est important de bien assimiler ce que nous venons de voir avant de continuer.`,
            keyPoints: [
              `Faire le lien entre ${item.title} et ${module.items[itemIndex + 1].title}`,
              `S'assurer que les concepts précédents sont bien compris`,
              `Préparer l'introduction des nouveaux concepts`
            ],
            arguments: [
              `La progression pédagogique est construite de manière séquentielle`,
              `Chaque élément s'appuie sur les précédents pour construire une compréhension globale`
            ],
            sources: [],
            questions: [
              'Avez-vous des questions sur ce que nous venons de voir ?',
              'Y a-t-il des points qui nécessitent des précisions avant de continuer ?',
              'Êtes-vous prêts à passer à la suite ?'
            ],
            examples: [],
            estimatedTime: 2,
            order: order++
          });
          totalMinutes += 2;
        }
      });

      // Résumé du module
      sections.push({
        title: `Résumé - ${module.title}`,
        type: 'summary',
        content: `Pour résumer ce module "${module.title}", nous avons couvert les concepts fondamentaux, les techniques pratiques, et les applications concrètes. Il est important de bien intégrer ces éléments car ils constituent la base pour la suite du parcours.`,
        keyPoints: [
          'Synthétiser les points essentiels à retenir',
          'Identifier les applications pratiques dans votre contexte',
          'Comprendre les liens avec les autres modules',
          'Préparer les prochaines étapes d\'apprentissage'
        ],
        arguments: [
          `La synthèse permet de consolider les apprentissages et de créer des liens entre les concepts`,
          `L'identification des applications pratiques facilite le transfert des connaissances`,
          `La compréhension des liens entre modules renforce la cohérence du parcours`
        ],
        sources: [],
        questions: [
          'Quels sont les points qui vous semblent les plus importants dans ce module ?',
          'Avez-vous des questions ou des points à clarifier ?',
          'Comment envisagez-vous d\'appliquer ces connaissances ?',
          'Quels sont les éléments que vous souhaitez approfondir ?'
        ],
        examples: [],
        estimatedTime: 5,
        order: order++
      });
      totalMinutes += 5;
    });

    // Conclusion générale
    sections.push({
      title: 'Conclusion du cours',
      type: 'summary',
      content: `Pour conclure ce cours "${courseJson.title}", nous avons couvert l'ensemble des concepts fondamentaux, des techniques pratiques, et des applications concrètes. Vous disposez maintenant des connaissances et des compétences nécessaires pour appliquer ces éléments dans votre contexte professionnel. Il est important de continuer à pratiquer et à approfondir ces concepts pour les intégrer durablement.`,
      keyPoints: [
        'Synthétiser les concepts principaux abordés dans le cours',
        'Identifier les applications pratiques dans différents contextes',
        'Comprendre les liens entre les différents modules',
        'Connaître les ressources disponibles pour approfondir',
        'Définir un plan d\'action pour l\'application des connaissances'
      ],
      arguments: [
        'La synthèse finale permet de consolider les apprentissages et de créer une vision d\'ensemble',
        'L\'identification des applications pratiques facilite le transfert des connaissances',
        'La connaissance des ressources complémentaires encourage la poursuite de l\'apprentissage',
        'Un plan d\'action concret favorise l\'application immédiate des connaissances'
      ],
      sources: [],
      questions: [
        'Quels sont les points que vous souhaitez approfondir ?',
        'Comment allez-vous appliquer ces connaissances dans votre contexte ?',
        'Quels sont les défis que vous anticipez dans l\'application de ces concepts ?',
        'Quelles ressources complémentaires souhaitez-vous explorer ?',
        'Avez-vous des questions finales ou des points à clarifier ?'
      ],
      examples: [],
      estimatedTime: 10,
      order: order++
    });
    totalMinutes += 10;

    setScriptSections(sections);
    setTotalTime(totalMinutes);
    // Développer toutes les sections par défaut
    setExpandedSections(new Set(sections.map((_, i) => i)));
  };

  const extractItemContent = (item: CourseJson['modules'][0]['items'][0]) => {
    const content = item.content || {};
    const keyPoints: string[] = [];
    const arguments_: string[] = [];
    const sources: string[] = [];
    const questions: string[] = [];
    const examples: string[] = [];

    // Extraire le contenu du body (TipTap JSON)
    let mainContent = '';
    if (content.body) {
      mainContent = extractTextFromTipTap(content.body);
    } else if (content.description) {
      mainContent = content.description;
    } else if (typeof content === 'string') {
      mainContent = content;
    }

    // Extraire les points clés, arguments, sources, exemples du contenu
    const lines = mainContent.split('\n');
    let currentSection = '';
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const lowerLine = trimmed.toLowerCase();
      
      // Détecter les sections spéciales
      if (lowerLine.includes('points clés') || lowerLine.includes('points essentiels')) {
        currentSection = 'keyPoints';
      } else if (lowerLine.includes('argument') || lowerLine.includes('raison')) {
        currentSection = 'arguments';
      } else if (lowerLine.includes('source') || lowerLine.includes('référence') || lowerLine.includes('bibliographie')) {
        currentSection = 'sources';
      } else if (lowerLine.includes('exemple') || lowerLine.includes('cas pratique') || lowerLine.includes('illustration')) {
        currentSection = 'examples';
      } else if (lowerLine.includes('question') || lowerLine.includes('interroger')) {
        currentSection = 'questions';
      }
      
      // Extraire selon le contexte
      if (trimmed && !trimmed.startsWith('#')) {
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.match(/^\d+\./)) {
          const cleanText = trimmed.replace(/^[-*•]\s+|\d+\.\s+/, '').trim();
          if (currentSection === 'keyPoints' || (!currentSection && cleanText.length > 0)) {
            keyPoints.push(cleanText);
          } else if (currentSection === 'arguments') {
            arguments_.push(cleanText);
          } else if (currentSection === 'examples') {
            examples.push(cleanText);
          } else if (currentSection === 'questions') {
            questions.push(cleanText.replace(/[?？]/g, '').trim());
          }
        } else if (lowerLine.includes('source:') || lowerLine.includes('référence:')) {
          sources.push(trimmed.replace(/^.*(?:source|référence):\s*/i, '').trim());
        } else if (lowerLine.includes('exemple:') || lowerLine.includes('ex:')) {
          examples.push(trimmed.replace(/^.*(?:exemple|ex):\s*/i, '').trim());
        } else if (trimmed.endsWith('?') || trimmed.endsWith('？')) {
          questions.push(trimmed);
        }
      }
    });

    // Si pas de points clés trouvés, extraire les titres de sections
    if (keyPoints.length === 0) {
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('#')) {
          keyPoints.push(trimmed.replace(/^#+\s+/, ''));
        }
      });
    }

    // Ajouter des questions par défaut si aucune n'est trouvée
    if (questions.length === 0) {
      questions.push(
        `Qu'est-ce qui vous semble le plus important dans "${item.title}" ?`,
        'Avez-vous des questions sur ce sujet ?',
        'Comment pouvez-vous appliquer ces concepts dans votre contexte ?'
      );
    }

    // Générer des arguments si aucun n'est trouvé mais qu'il y a du contenu
    if (arguments_.length === 0 && mainContent.length > 100) {
      arguments_.push(
        `Expliquer pourquoi ${item.title} est important dans le contexte du cours`,
        `Développer les concepts clés de manière progressive`,
        `Illustrer avec des exemples concrets et des cas pratiques`
      );
    }

    return {
      mainContent: mainContent || `Contenu de "${item.title}". Développer les concepts principaux, expliquer les mécanismes, et illustrer avec des exemples concrets.`,
      keyPoints: keyPoints.length > 0 ? keyPoints : [
        `Comprendre les concepts fondamentaux de ${item.title}`,
        `Maîtriser les applications pratiques`,
        `Identifier les points d'attention et les pièges courants`
      ],
      arguments: arguments_,
      sources: sources.length > 0 ? sources : [],
      questions: questions,
      examples: examples.length > 0 ? examples : []
    };
  };

  const extractChapterContent = (chapter: CourseJson['modules'][0]['items'][0]['chapters'][0]) => {
    let mainContent = '';
    if (chapter.content) {
      mainContent = extractTextFromTipTap(chapter.content);
    } else if (chapter.game_content) {
      mainContent = `Contenu de jeu interactif: ${chapter.title}`;
    }

    return {
      mainContent: mainContent || `Contenu du chapitre "${chapter.title}"`,
      keyPoints: [`Points clés de ${chapter.title}`],
      arguments: [],
      sources: [],
      questions: [`Qu'avez-vous retenu de ${chapter.title} ?`],
      examples: []
    };
  };

  const extractTextFromTipTap = (content: any): string => {
    if (typeof content === 'string') return content;
    if (!content || typeof content !== 'object') return '';

    let text = '';
    if (content.content && Array.isArray(content.content)) {
      content.content.forEach((node: any) => {
        if (node.type === 'paragraph' || node.type === 'heading') {
          if (node.content && Array.isArray(node.content)) {
            node.content.forEach((textNode: any) => {
              if (textNode.type === 'text') {
                const nodeText = textNode.text || '';
                // Ajouter un préfixe pour les titres
                if (node.type === 'heading') {
                  const level = node.attrs?.level || 1;
                  const prefix = '#'.repeat(level) + ' ';
                  text += prefix + nodeText + '\n';
                } else {
                  text += nodeText + '\n';
                }
              } else if (textNode.type === 'hardBreak') {
                text += '\n';
              }
            });
          }
        } else if (node.type === 'bulletList' || node.type === 'orderedList') {
          if (node.content && Array.isArray(node.content)) {
            node.content.forEach((listItem: any, index: number) => {
              if (listItem.content && Array.isArray(listItem.content)) {
                listItem.content.forEach((paragraph: any) => {
                  if (paragraph.content && Array.isArray(paragraph.content)) {
                    const prefix = node.type === 'orderedList' ? `${index + 1}. ` : '• ';
                    paragraph.content.forEach((textNode: any) => {
                      if (textNode.type === 'text') {
                        text += prefix + textNode.text + '\n';
                      }
                    });
                  }
                });
              }
            });
          }
        } else if (node.type === 'blockquote') {
          if (node.content && Array.isArray(node.content)) {
            node.content.forEach((paragraph: any) => {
              if (paragraph.content && Array.isArray(paragraph.content)) {
                paragraph.content.forEach((textNode: any) => {
                  if (textNode.type === 'text') {
                    text += '> ' + textNode.text + '\n';
                  }
                });
              }
            });
          }
        } else if (node.type === 'codeBlock') {
          if (node.content && Array.isArray(node.content)) {
            node.content.forEach((textNode: any) => {
              if (textNode.type === 'text') {
                text += '```\n' + textNode.text + '\n```\n';
              }
            });
          }
        }
      });
    }
    return text.trim();
  };

  const extractKeyPoints = (text: string): string[] => {
    const points: string[] = [];
    const lines = text.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('**') || trimmed.match(/^[-*•]\s+/)) {
        points.push(trimmed.replace(/^[-*•]\s+|\*\*/g, ''));
      }
    });
    return points.length > 0 ? points : ['Points clés à développer'];
  };

  const estimateTimeForItem = (item: CourseJson['modules'][0]['items'][0]): number {
    // Estimation basée sur le type d'item
    switch (item.type) {
      case 'slide':
        return 10; // 10 minutes par slide
      case 'resource':
        return 15; // 15 minutes pour une ressource
      case 'exercise':
        return 20; // 20 minutes pour un exercice
      case 'tp':
        return 45; // 45 minutes pour un TP
      case 'game':
        return 15; // 15 minutes pour un jeu
      default:
        return 10;
    }
  };

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? mins : ''}`;
    }
    return `${mins}min`;
  };

  const printScript = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Cours non trouvé'}
          </h2>
          <Link to="/trainer" className="btn-primary">
            Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TrainerHeader />
      <div className="p-6">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Link
                  to={`/courses/${courseId}`}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                >
                  <Eye className="w-5 h-5" />
                  <span>Voir le cours</span>
                </Link>
                <Link
                  to="/trainer"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-700"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Retour</span>
                </Link>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={printScript}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Printer className="w-5 h-5" />
                  <span>Imprimer</span>
                </button>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Script pédagogique - {course.title}
            </h1>
            <div className="flex items-center space-x-6 text-gray-600">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">Durée totale estimée: {formatTime(totalTime)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>{scriptSections.length} sections</span>
              </div>
            </div>
          </div>

          {/* Script sections */}
          <div className="space-y-4">
            {scriptSections.map((section, index) => {
              const isExpanded = expandedSections.has(index);
              const typeColors = {
                introduction: 'bg-blue-50 border-blue-200',
                content: 'bg-white border-gray-200',
                exercise: 'bg-green-50 border-green-200',
                transition: 'bg-yellow-50 border-yellow-200',
                summary: 'bg-purple-50 border-purple-200'
              };

              return (
                <div
                  key={index}
                  className={`border rounded-lg shadow-sm ${typeColors[section.type]}`}
                >
                  {/* Section header */}
                  <button
                    onClick={() => toggleSection(index)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-opacity-80 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1 text-left">
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {section.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded ${
                            section.type === 'introduction' ? 'bg-blue-100 text-blue-700' :
                            section.type === 'exercise' ? 'bg-green-100 text-green-700' :
                            section.type === 'transition' ? 'bg-yellow-100 text-yellow-700' :
                            section.type === 'summary' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {section.type}
                          </span>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(section.estimatedTime)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Section content */}
                  {isExpanded && (
                    <div className="px-6 pb-6 space-y-4 border-t">
                      {/* Contenu principal */}
                      <div className="pt-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <h4 className="font-semibold text-gray-900">Contenu à présenter</h4>
                        </div>
                        <div className="prose max-w-none bg-white p-4 rounded border">
                          <p className="whitespace-pre-wrap text-gray-700">{section.content}</p>
                        </div>
                      </div>

                      {/* Points clés */}
                      {section.keyPoints.length > 0 && (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Target className="w-5 h-5 text-blue-500" />
                            <h4 className="font-semibold text-gray-900">Points clés à développer</h4>
                          </div>
                          <ul className="list-disc list-inside space-y-1 bg-white p-4 rounded border">
                            {section.keyPoints.map((point, i) => (
                              <li key={i} className="text-gray-700">{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Arguments */}
                      {section.arguments.length > 0 && (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Lightbulb className="w-5 h-5 text-yellow-500" />
                            <h4 className="font-semibold text-gray-900">Arguments à développer</h4>
                          </div>
                          <ul className="list-disc list-inside space-y-1 bg-white p-4 rounded border">
                            {section.arguments.map((arg, i) => (
                              <li key={i} className="text-gray-700">{arg}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Sources */}
                      {section.sources.length > 0 && (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <BookOpen className="w-5 h-5 text-green-500" />
                            <h4 className="font-semibold text-gray-900">Sources et références</h4>
                          </div>
                          <ul className="list-disc list-inside space-y-1 bg-white p-4 rounded border">
                            {section.sources.map((source, i) => (
                              <li key={i} className="text-gray-700">{source}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Questions */}
                      {section.questions.length > 0 && (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <MessageSquare className="w-5 h-5 text-purple-500" />
                            <h4 className="font-semibold text-gray-900">Questions à poser</h4>
                          </div>
                          <ul className="list-disc list-inside space-y-1 bg-white p-4 rounded border">
                            {section.questions.map((question, i) => (
                              <li key={i} className="text-gray-700">{question}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Exemples */}
                      {section.examples.length > 0 && (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Lightbulb className="w-5 h-5 text-orange-500" />
                            <h4 className="font-semibold text-gray-900">Exemples concrets</h4>
                          </div>
                          <ul className="list-disc list-inside space-y-1 bg-white p-4 rounded border">
                            {section.examples.map((example, i) => (
                              <li key={i} className="text-gray-700">{example}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

