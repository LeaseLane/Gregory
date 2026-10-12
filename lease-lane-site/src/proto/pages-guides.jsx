/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/pages-guides.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon, Button } from '@/components/ds';
import { Section } from '@/proto/accueil';
import { TitreBloc, Fleche, AppelFinal, gab } from '@/proto/blocs';
import { PBHeros } from '@/proto/pages-proprio-b';
import { LL_LANGUE } from '@/lib/langue';
import { LL_FAQ } from '@/proto/faq';
import { __ssr } from '@/lib/hydratation';
const LIGNE = '1px solid rgba(12,33,71,.16)';
const QUARTIERS = [{
  s: 'limoilou',
  situe: 'Basse-ville, au nord de la rivière Saint-Charles',
  chiffre: ['Locataires', '75,8 %', 'des habitants du Vieux-Limoilou étaient locataires au recensement de 2016'],
  n: 'Limoilou',
  dans: 'à Limoilou',
  arr: 'La Cité-Limoilou',
  d: 'Au nord de la rivière Saint-Charles. La 3e Avenue en est l’artère commerçante.',
  rep: ['3e Avenue', 'Rivière Saint-Charles', 'ExpoCité'],
  vie: "Un quartier vivant et familial, apprécié des jeunes professionnels. Cafés, restaurants et commerces de proximité se concentrent sur la 3e Avenue.",
  log: "Surtout des plex avec escaliers extérieurs, typiques de Québec, et des 4 ½ et 5 ½ dans des rues en grille faciles à parcourir.",
  pres: ["Lieu historique national Cartier-Brébeuf", "Domaine de Maizerets", "Hôpital de l’Enfant-Jésus"],
  sav: "Le stationnement se fait souvent dans la rue. Vérifiez si la rue est couverte par la vignette de stationnement pour résidents de la Ville.",
  hist: ["En 1535, Jacques Cartier accoste sur les berges de la rivière Saint-Charles, tout près de l’actuel Limoilou. En 1626, la seigneurie de Notre-Dame-des-Anges est concédée aux Jésuites, et les terres au nord de l’embouchure de la rivière deviennent des fermes. Cette vocation agricole dure jusqu’au début du XXe siècle.", "En 1847, le marchand de bois William Hedley Anderson divise sa terre en lots pour attirer des travailleurs : c’est la naissance du village de Hedleyville. Trois autres villages ouvriers suivent : Stadacona, Parkville et New Waterford. Le surpeuplement de Québec, les épidémies de choléra et les incendies de 1845 poussent de nombreuses familles vers ces villages. Le pont Lavigueur, en 1867, et l’arrivée du chemin de fer, en 1890, facilitent leur croissance.", "En 1893, après un incendie qui ravage une partie d’Hedleyville, les villages se regroupent pour former la municipalité de Limoilou, nommée en hommage à Jacques Cartier, sieur de Limoëlou. Comme le territoire est encore surtout agricole, les promoteurs s’inspirent du quadrillage de New York : des rues d’est en ouest, des avenues du nord au sud et des immeubles résidentiels en brique, souvent de plus de trois étages.", "Annexé à Québec en 1909, Limoilou connaît un boom : sa population passe de 3 652 personnes en 1911 à 25 795 en 1931. Le quartier s’étend ensuite vers l’est, à Maizerets, et vers le nord, à Lairet. On appelle aujourd’hui « Vieux-Limoilou » le secteur d’origine, l’un des plus denses de la ville."],
  portrait: ["Le Vieux-Limoilou est délimité par la rivière Saint-Charles au sud, le boulevard Wilfrid-Hamel, l’avenue Eugène-Lamontagne et la 18e Rue au nord, et l’autoroute Laurentienne à l’ouest. Son plan en damier est traversé du nord au sud par la 1re Avenue; la 3e Avenue est son artère commerçante, avec ses cafés, ses restaurants et ses boutiques.", "C’est un quartier de locataires : au recensement de 2016, 75,8 % de ses habitants l’étaient. On y trouve le campus principal du Cégep Limoilou, le Lieu historique national Cartier-Brébeuf, l’École de cirque de Québec et des événements de quartier comme le festival Envol et Macadam."],
  dates: [["1535", "Jacques Cartier accoste près de la rivière Saint-Charles"], ["1847", "Naissance du village de Hedleyville"], ["1893", "Fondation de la municipalité de Limoilou"], ["1909", "Annexion à la ville de Québec"], ["1931", "25 795 habitants"]],
  wiki: "https://fr.wikipedia.org/wiki/Vieux-Limoilou"
}, {
  s: 'montcalm',
  situe: 'Haute-ville, à l’ouest du Vieux-Québec',
  chiffre: ['Locataires', '58,7 %', 'des habitants étaient locataires au recensement de 2016'],
  n: 'Montcalm',
  dans: 'à Montcalm',
  arr: 'La Cité-Limoilou',
  d: 'Dans la haute-ville, à l’ouest du Vieux-Québec. L’avenue Cartier en est l’artère commerçante; les plaines d’Abraham et le Musée national des beaux-arts du Québec sont tout près.',
  rep: ['Avenue Cartier', 'Plaines d’Abraham', 'Musée national des beaux-arts du Québec'],
  vie: "Un quartier résidentiel recherché, calme et verdoyant, avec une vie de quartier animée autour de l’avenue Cartier.",
  log: "Des maisons en rangée, des plex et de grands logements anciens, souvent avec boiseries et hauts plafonds.",
  pres: ["Les Halles du Petit Quartier", "Grande Allée", "Plaines d’Abraham"],
  sav: "Les logements libres partent vite. Préparez votre demande de location avant la visite.",
  hist: ["Jusqu’au début du XXe siècle, Montcalm est une banlieue de Québec, d’abord agricole. En 1639, Jean Bourdon, son premier colon, reçoit une terre de 50 arpents autour de l’actuelle avenue Murray. Le 28 avril 1760, la bataille de Sainte-Foy se déroule sur le site de l’actuel parc des Braves, dont le terrain est acquis en 1845 pour y ériger le Monument des Braves.", "Après la Conquête, des notables anglophones, dont James Murray et Samuel Holland, rachètent les domaines laissés par l’élite française. Au début du XIXe siècle, la bourgeoisie anglophone y possède de vastes villas, loin des problèmes d’hygiène de la ville. Dès 1833, le faubourg Guénette et ses habitations modestes prennent forme entre les avenues Bourlamaque, Crémazie et Cartier.", "En 1908, le secteur devient la ville de Montcalm, qui interdit les manufactures et fixe une valeur minimale aux nouvelles constructions. Elle est annexée à Québec en 1913, après un référendum dont l’un des enjeux était le financement d’un réseau d’égouts.", "Entre 1900 et 1940, Québec triple sa superficie et double sa population, et Montcalm s’urbanise vite. Le commerce s’installe d’abord sur le chemin Sainte-Foy, puis sur l’avenue Cartier dès les années 1920. Les principales caractéristiques du quartier se fixent entre 1914 et 1960 : des triplex, puis des tours de logements et de bureaux dans les années 1960."],
  portrait: ["Montcalm fait partie de la haute-ville, à l’ouest des quartiers Saint-Jean-Baptiste et Vieux-Québec. Ses rues, presque toutes rectilignes, se croisent à angle droit. L’avenue Cartier et le boulevard René-Lévesque, entre De Salaberry et Bourlamaque, concentrent bars, restaurants et petits commerces; la Grande Allée et le chemin Sainte-Foy le traversent d’est en ouest.", "Au recensement de 2016, 58,7 % des habitants étaient locataires. Le quartier borde le parc national des Champs-de-Bataille, qui comprend les plaines d’Abraham et le parc des Braves. Il abrite aussi le Musée national des beaux-arts du Québec et le Cinéma Cartier, ouvert en 1937."],
  dates: [["1639", "Première terre concédée à Jean Bourdon"], ["1760", "Bataille de Sainte-Foy, au parc des Braves"], ["1908", "Création de la ville de Montcalm"], ["1913", "Annexion à la ville de Québec"], ["1937", "Ouverture du Cinéma Cartier"]],
  wiki: "https://fr.wikipedia.org/wiki/Montcalm_(quartier)"
}, {
  s: 'saint-roch',
  situe: 'Basse-ville, au pied de la falaise',
  chiffre: ['Emplois', '+40 %', 'de personnes qui y travaillent entre 1996 et 2017'],
  n: 'Saint-Roch',
  dans: 'à Saint-Roch',
  arr: 'La Cité-Limoilou',
  d: 'Dans la basse-ville, au pied de la falaise. La rue Saint-Joseph Est en est l’artère commerçante; la gare du Palais est à proximité.',
  rep: ['Rue Saint-Joseph Est', 'Jardin de Saint-Roch', 'Gare du Palais'],
  vie: "Le centre-ville de la basse-ville : restaurants, bureaux, entreprises technologiques et une vie culturelle active.",
  log: "Des condos et des lofts dans d’anciens bâtiments industriels réaménagés, et des logements au-dessus des commerces.",
  pres: ["Bibliothèque Gabrielle-Roy", "Église Saint-Roch", "Gare du Palais"],
  sav: "Un des secteurs les mieux desservis par le transport en commun. On y vit facilement sans voiture.",
  hist: ["Saint-Roch est l’un des plus anciens faubourgs de Québec. Au début du XVIIe siècle, Champlain y envisage une cité modèle nommée Ludovica. En 1620, les Récollets bâtissent un couvent au bord de la rivière Saint-Charles, futur premier Hôpital général de la ville. En 1692, ils construisent une chapelle dédiée à saint Roch, qui donne ensuite son nom à la rue, au faubourg, à la paroisse, fondée en 1829, puis au quartier.", "Le quartier prend son essor au milieu du XVIIIe siècle avec les chantiers navals de la rivière Saint-Charles. En 1857, une halle de marché ouvre sur la place Jacques-Cartier. En 1864, l’entreprise de cordonnerie mécanique de Guillaume Bresse lance des dizaines de manufactures de chaussures. Malgré les incendies de 1845, 1866 et 1870, Saint-Roch connaît une prospérité sans précédent à partir de 1880.", "Durant la première moitié du XXe siècle, la rue Saint-Joseph est le grand centre commercial de Québec, avec les magasins à rayons Paquet, Pollack, Syndicat de Québec et Laliberté. Les deux tiers de la population de la ville habitent alors Saint-Roch ou Saint-Sauveur. Dès les années 1950, les banlieues attirent les familles, et la population du quartier passe d’environ 20 000 à 5 000 personnes. En 1974, une partie de la rue Saint-Joseph est couverte d’un toit : c’est le Mail Saint-Roch.", "À la fin des années 1990, la Ville lance un programme de revitalisation. Le mail est démoli de 2000 à 2007, des façades sont rénovées et d’anciennes manufactures deviennent des bureaux, des ateliers d’artistes ou des coopératives d’habitation. Des entreprises d’informatique et de jeux vidéo s’installent autour du boulevard Charest. Entre 1996 et 2017, le nombre de personnes qui travaillent dans le quartier augmente de 40 %."],
  portrait: ["Saint-Roch se trouve dans la basse-ville, au pied de la colline de Québec. La rue Saint-Joseph Est, rouverte à ciel ouvert, est son artère commerçante; le boulevard Charest et les rues de la Couronne et Dorchester réunissent bureaux et commerces. La gare du Palais est à proximité.", "On y trouve des lofts et des condos dans d’anciens bâtiments industriels, des plex construits à la fin du XIXe siècle et des immeubles à logements des années 1940. La Bibliothèque Gabrielle-Roy, l’église Saint-Roch et le Jardin de Saint-Roch en sont des repères."],
  dates: [["1692", "Chapelle dédiée à saint Roch"], ["1857", "Ouverture de la halle de marché"], ["1864", "Début de l’industrie de la chaussure"], ["1974", "Ouverture du Mail Saint-Roch"], ["2007", "Fin de la démolition du mail"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Roch_(Québec)"
}, {
  s: 'saint-sauveur',
  situe: 'Basse-ville, à l’ouest de Saint-Roch',
  chiffre: ['Annexion', '1889', 'annexé à la ville de Québec après un référendum'],
  n: 'Saint-Sauveur',
  dans: 'à Saint-Sauveur',
  arr: 'La Cité-Limoilou',
  d: 'Dans la basse-ville, à l’ouest de Saint-Roch. La rue Saint-Vallier Ouest le traverse.',
  rep: ['Rue Saint-Vallier Ouest', 'Boulevard Charest'],
  vie: "Un ancien quartier ouvrier, tranquille et authentique, à quelques minutes à pied de Saint-Roch.",
  log: "Des maisons ouvrières en rangée et des plex, souvent à des loyers plus abordables que dans la haute-ville.",
  pres: ["Parc Durocher", "Parc linéaire de la Rivière-Saint-Charles", "Boulevard Charest"],
  sav: "Les rues sont étroites et le stationnement est surtout dans la rue. Informez-vous sur les places incluses au bail.",
  hist: ["Au début du Régime français, les basses terres qui bordent la rivière Saint-Charles forment les terres communales. En 1618, Champlain propose d’y fonder une ville nommée « Ludovica », un projet abandonné vers 1638. En 1653, Jean Le Sueur, premier prêtre séculier de la Nouvelle-France, surnommé « Monsieur de Saint-Sauveur », reçoit des terres entre les actuelles rues Durocher et Montmagny : le quartier lui doit son nom.", "Vers 1845 naît Boisseauville, lotie sur l’ancien domaine Bois-Bijou. Les chantiers navals, le commerce du bois et le port attirent une main-d’œuvre nombreuse, et les règles de construction y permettent des maisons qui ne sont pas à l’épreuve du feu. Après l’incendie de Saint-Roch en 1845, de nombreuses familles s’y installent. Le quartier obtient sa charte municipale en 1862 et prend le nom de Saint-Sauveur en 1872.", "Le Grand incendie de Québec rase Saint-Sauveur en 1866. En 1889, un autre incendie détruit environ 500 maisons et laisse de quatre à cinq mille personnes sans abri. La même année, les citoyens approuvent par référendum l’annexion à Québec, qui apporte en moins de trois ans l’eau courante, les égouts, les trottoirs, des rues pavées et l’éclairage électrique.", "Au XXe siècle, Saint-Sauveur reste un quartier ouvrier. En 1914, la Laiterie de Québec, future Laiterie Arctic, y est la première de la ville à pasteuriser son lait. Plus récemment, le chemin de fer qui coupait le quartier du parc Victoria est retiré en 1974, le boulevard Charest est réaménagé de 2006 à 2008 et les berges de la rivière Saint-Charles sont renaturalisées en 2007."],
  portrait: ["Saint-Sauveur se trouve dans la basse-ville, à l’ouest de Saint-Roch. La rue Saint-Vallier Ouest, le boulevard Charest Ouest et le boulevard Langelier en sont les grands axes; les ponts Scott et Marie-de-l’Incarnation le relient au nord, par-dessus la rivière Saint-Charles.", "Le quartier compte de nombreux parcs, dont le parc Victoria, le parc Durocher, le parc Dollard-des-Ormeaux et le parc linéaire des rivières Saint-Charles et du Berger, ainsi que le Patro Laval et l’Hôtel-Dieu du Sacré-Cœur. Plusieurs anciennes églises ont fait place à des logements et à des coopératives d’habitation."],
  dates: [["1653", "Terres concédées à Jean Le Sueur"], ["1845", "Naissance de Boisseauville"], ["1866", "Grand incendie de Québec"], ["1889", "Annexion à la ville de Québec"], ["2007", "Renaturalisation des berges de la rivière"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Sauveur_(quartier)"
}, {
  s: 'sainte-foy',
  situe: 'Ouest de la ville, près des ponts',
  chiffre: ['Ville', '1949', 'Sainte-Foy devient une ville; elle est fusionnée à Québec en 2002'],
  n: 'Sainte-Foy',
  dans: 'à Sainte-Foy',
  arr: 'Sainte-Foy–Sillery–Cap-Rouge',
  d: 'À l’ouest de la ville. On y trouve le campus de l’Université Laval et les centres commerciaux du boulevard Laurier.',
  rep: ['Université Laval', 'Boulevard Laurier', 'Chemin Sainte-Foy'],
  vie: "Un secteur étudiant et commerçant, avec l’Université Laval, de grands centres commerciaux et beaucoup de services.",
  log: "Beaucoup d’immeubles d’appartements et de tours, des logements meublés pour étudiants et des maisons dans les rues résidentielles.",
  pres: ["Université Laval", "CHUL", "Aquarium du Québec"],
  sav: "Plusieurs baux suivent l’année scolaire. Les logements se libèrent surtout au début de l’été.",
  hist: ["En 1638, les Jésuites fondent la mission Notre-Dame-de-Foy pour desservir les colons de l’ouest de la colline de Québec. En 1667, une vingtaine de familles vivent sur la Côte Saint-Michel, traversée par l’actuel chemin Sainte-Foy, et une chapelle de bois est construite près de l’actuel chemin des Quatre-Bourgeois. La paroisse est créée en 1698, et une première église de pierre est bâtie en 1719, au site actuel du parc de la Visitation.", "Le 28 avril 1760, le chevalier de Lévis bat les troupes britanniques du général Murray à Sainte-Foy, sans pouvoir reprendre Québec. Au XIXe siècle, des notables y construisent des villas et exploitent des fermes; quatre d’entre elles, bâties entre 1849 et 1856, donnent son nom au chemin des Quatre-Bourgeois.", "Le pont de Québec relie Sainte-Foy à la Rive-Sud en 1917. La paroisse reste rurale jusque dans les années 1940, puis devient une ville le 10 mars 1949. La même année, le boulevard Laurier ouvre et le campus de l’Université Laval est commencé. L’hôpital Sainte-Foy, ouvert en 1954, devient le Centre hospitalier de l’Université Laval (CHUL) en 1968.", "Place Sainte-Foy ouvre en 1958, puis Place Laurier en 1961. La construction résidentielle change vite : en 1958, 88 % des nouveaux logements sont des maisons unifamiliales; en 1968, cette part tombe à 13 % avec l’arrivée des immeubles d’appartements. En 1970, l’annexion d’une partie de L’Ancienne-Lorette triple la superficie de la ville. Sainte-Foy est fusionnée à Québec en 2002."],
  portrait: ["Sainte-Foy fait aujourd’hui partie de l’arrondissement de Sainte-Foy–Sillery–Cap-Rouge. Le boulevard Laurier, qui mène au pont de Québec, réunit les grands centres commerciaux, dont Place Sainte-Foy et Place Laurier, et de nombreux hôtels; le chemin Sainte-Foy et le chemin des Quatre-Bourgeois le traversent d’est en ouest.", "Le campus de l’Université Laval et le CHUL en font un grand pôle d’études et de soins. Beaucoup d’habitants s’identifient encore aux anciens quartiers paroissiaux, chacun organisé autour d’une église, d’un parc et d’une école primaire."],
  dates: [["1638", "Fondation de la mission Notre-Dame-de-Foy"], ["1760", "Bataille de Sainte-Foy"], ["1917", "Ouverture du pont de Québec"], ["1949", "Sainte-Foy devient une ville"], ["2002", "Fusion avec la ville de Québec"]],
  wiki: "https://fr.wikipedia.org/wiki/Sainte-Foy_(Québec)"
}, {
  s: 'charlesbourg',
  situe: 'Nord de la ville, autour du Trait-Carré',
  chiffre: ['Trait-Carré', '1665', 'Jean Talon fonde le Trait-Carré, au tracé en étoile'],
  n: 'Charlesbourg',
  dans: 'à Charlesbourg',
  arr: 'Charlesbourg',
  d: 'Au nord de la ville. Son cœur historique, le Trait-Carré, conserve le tracé en étoile du XVIIe siècle.',
  rep: ['Trait-Carré', 'Boulevard Henri-Bourassa'],
  vie: "Un secteur résidentiel calme et familial, avec son noyau patrimonial du Trait-Carré.",
  log: "Des maisons unifamiliales, des jumelés et des plex, souvent avec stationnement et cour.",
  pres: ["Trait-Carré", "Boulevard Henri-Bourassa", "Autoroute Laurentienne"],
  sav: "La voiture est souvent utile ici. Vérifiez le stationnement et le déneigement prévus au bail.",
  hist: ["Le territoire fait partie de la seigneurie de Notre-Dame-des-Anges, concédée aux Jésuites en 1626. En 1665, l’intendant Jean Talon y fonde un village au plan unique : un carré central, le Trait-Carré, réservé à l’église, au presbytère et au cimetière, entouré des maisons des colons et de terres qui rayonnent en étoile.", "Un deuxième village, en demi-cercle faute d’espace, est établi juste au sud, à la Petite-Auvergne, puis un troisième en 1667 à Bourg-Royal, plus au nord-est. Ce plan en étoile, encore visible du haut des airs, fait de Charlesbourg le seul village de ce type au Canada.", "D’abord agricole, Charlesbourg devient une destination de villégiature pour les gens de Québec dans la première moitié du XXe siècle, puis une banlieue dans la seconde moitié. En 1976, Charlesbourg-Est, Notre-Dame-des-Laurentides, Orsainville et la cité de Charlesbourg fusionnent pour former la ville de Charlesbourg.", "En 2002, Charlesbourg est fusionnée à la ville de Québec et devient l’un de ses six arrondissements. Il compte six quartiers : Notre-Dame-des-Laurentides, Des Jésuites, Orsainville, Bourg-Royal, Trait-Carré et Saint-Rodrigue."],
  portrait: ["Charlesbourg se trouve au nord de La Cité-Limoilou, à l’ouest de Beauport et à l’est des Rivières et de La Haute-Saint-Charles. Le boulevard Henri-Bourassa et l’autoroute Laurentienne le relient au centre de Québec.", "L’arrondissement compte de nombreux espaces verts, dont le parc de la Montagne-des-Roches, le parc des Moulins, ancien jardin zoologique, et le Domaine Notre-Dame-des-Bois. Le Trait-Carré, avec son tracé du XVIIe siècle, en est le cœur patrimonial."],
  dates: [["1626", "Seigneurie concédée aux Jésuites"], ["1665", "Jean Talon fonde le Trait-Carré"], ["1667", "Fondation de Bourg-Royal"], ["1976", "Fusion qui forme la ville de Charlesbourg"], ["2002", "Charlesbourg devient un arrondissement de Québec"]],
  wiki: "https://fr.wikipedia.org/wiki/Charlesbourg"
}, {
  s: 'beauport',
  situe: 'Est de la ville, le long du fleuve',
  chiffre: ['Quartiers', '5', 'quartiers, du Vieux-Bourg aux Chutes-Montmorency'],
  n: 'Beauport',
  dans: 'à Beauport',
  arr: 'Beauport',
  d: 'À l’est de la ville, le long du fleuve. L’avenue Royale traverse le Vieux-Beauport; la chute Montmorency marque la limite est.',
  rep: ['Avenue Royale', 'Chute Montmorency', 'Baie de Beauport'],
  vie: "Un grand secteur résidentiel le long du fleuve, entre patrimoine et nature, prisé des familles.",
  log: "Des plex, des maisons et des immeubles d’appartements, avec plus d’espace que dans les quartiers centraux.",
  pres: ["Parc de la Chute-Montmorency", "Baie de Beauport", "Vieux-Beauport"],
  sav: "L’autoroute Dufferin-Montmorency relie Beauport au centre-ville en quelques minutes.",
  hist: ["Le 15 janvier 1634, la seigneurie de Beauport est concédée à Robert Giffard, chirurgien et apothicaire venu de Normandie. Elle s’étend entre les rivières Beauport et Montmorency et le fleuve. Un premier bourg, Fargy, y est créé, et le manoir seigneurial est érigé entre 1637 et 1642. Les avenues Royale, des Cascades et Seigneuriale en sont les chemins historiques.", "La seigneurie devient en 1845 la municipalité de paroisse de Notre-Dame-de-Miséricorde-de-Beauport. Vers la fin du XIXe siècle, le village se densifie, et des juristes et des médecins s’y joignent aux cultivateurs et aux artisans.", "Entre 1897 et 1937, plusieurs secteurs s’en détachent pour former des municipalités distinctes : Saint-Michel-Archange, Montmorency, Courville, Giffard, Villeneuve et Beauport-Ouest. Le village de Beauport devient une ville en 1924. Malgré la proximité de Québec, les environs restent agricoles jusqu’au milieu du XXe siècle.", "En 1976, Giffard, Villeneuve, Courville, Montmorency, Sainte-Thérèse-de-Lisieux et Saint-Michel-Archange sont fusionnées à Beauport. Lors des réorganisations municipales de 2002, Beauport est fusionnée à la ville de Québec, dont elle devient l’arrondissement le plus à l’est."],
  portrait: ["Beauport longe le fleuve Saint-Laurent, des battures de Beauport jusqu’à l’embouchure de la rivière Montmorency, près de la chute. L’arrondissement compte cinq quartiers : Vieux-Moulin, Vieux-Bourg, Saint-Michel, Chutes-Montmorency et Sainte-Thérèse-de-Lisieux.", "Le Vieux-Bourg, le plus ancien, conserve l’église de la Nativité-de-Notre-Dame et de nombreuses maisons historiques sur l’avenue Royale, qui font partie de l’arrondissement historique de Beauport. Le quartier Saint-Michel, le long de l’autoroute Félix-Leclerc, regroupe un cinéma de 16 écrans, des magasins à grande surface et des concessionnaires."],
  dates: [["1634", "Seigneurie concédée à Robert Giffard"], ["1845", "Municipalité de paroisse de Beauport"], ["1924", "Beauport devient une ville"], ["1976", "Grande fusion autour de Beauport"], ["2002", "Beauport devient un arrondissement de Québec"]],
  wiki: "https://fr.wikipedia.org/wiki/Beauport"
}, {
  s: 'lebourgneuf',
  situe: 'Centre-nord, près des autoroutes',
  chiffre: ['Nom', '1988', 'le quartier prend le nom de Lebourgneuf'],
  n: 'Lebourgneuf',
  dans: 'à Lebourgneuf',
  arr: 'Les Rivières',
  d: 'Au centre-nord de la ville, près des autoroutes Laurentienne et Félix-Leclerc. Les Galeries de la Capitale y sont situées.',
  rep: ['Galeries de la Capitale', 'Autoroute Laurentienne', 'Autoroute Félix-Leclerc'],
  vie: "Un secteur moderne de bureaux et de commerces, pratique pour qui travaille dans le nord de la ville.",
  log: "Surtout des immeubles d’appartements et des condos récents, souvent avec ascenseur et stationnement intérieur.",
  pres: ["Galeries de la Capitale", "Autoroute Félix-Leclerc", "Autoroute Laurentienne"],
  sav: "Un secteur pensé pour l’auto : demandez si une place de stationnement est incluse et à quel coût.",
  hist: ["La fondation de la paroisse Saint-Ambroise-de-la-Jeune-Lorette, en 1795, marque le début de la colonisation du territoire. Dès la fin du XVIIe siècle, des Hurons-Wendats venus de Lorette, aujourd’hui L’Ancienne-Lorette, s’y étaient installés; leur réserve de Wendake se trouve aujourd’hui juste à côté. En 1963, la partie sud de la paroisse prend le nom de Neufchâtel, intégrée à Québec en 1971.", "Le nom Lebourgneuf réunit la fin de « Charlesbourg » et le début de « Neufchâtel », les deux secteurs qui l’encadrent. Le quartier correspond à l’ancienne municipalité de Charlesbourg-Ouest, détachée de Charlesbourg en 1952, annexée à Québec en 1973 et renommée en 1988. Le boulevard Lebourgneuf porte ce nom depuis 1977.", "Jusque dans les années 1950, le secteur vit surtout de l’agriculture et compte peu d’habitants. Quelques petites maisons de campagne subsistent sur le boulevard Bastien et l’avenue Chauveau. Il s’urbanise ensuite rapidement, avec des secteurs résidentiels récents et de grandes zones de commerces et d’entreprises.", "Le quartier actuel, Neufchâtel-Est–Lebourgneuf, est formé en 2003. Il fait partie de l’arrondissement des Rivières et se trouve près du centre géographique de la ville de Québec."],
  portrait: ["Le quartier couvre la partie de l’arrondissement des Rivières située au nord de l’autoroute Félix-Leclerc et à l’est de la rivière Saint-Charles; la rivière du Berger le traverse aussi. Lebourgneuf en occupe l’est, avec des secteurs résidentiels récents et de vastes zones commerciales et d’affaires en bordure des autoroutes Laurentienne et Félix-Leclerc.", "Ses grands axes sont l’avenue Chauveau et les boulevards Bastien, Lebourgneuf, Pierre-Bertrand et Robert-Bourassa. On y trouve les Galeries de la Capitale et leur Méga-parc, le parc Chauveau et le parc de l’Escarpement."],
  dates: [["1795", "Fondation de la paroisse Saint-Ambroise"], ["1952", "Création de Charlesbourg-Ouest"], ["1973", "Annexion à la ville de Québec"], ["1977", "Le boulevard Lebourgneuf est nommé"], ["1988", "Le quartier prend le nom de Lebourgneuf"]],
  wiki: "https://fr.wikipedia.org/wiki/Neufchâtel-Est–Lebourgneuf"
}, {
  s: 'vieux-quebec',
  situe: 'Centre historique, entouré de fortifications',
  chiffre: ['UNESCO', '1985', 'inscription sur la Liste du patrimoine mondial'],
  n: 'Vieux-Québec',
  dans: 'dans le Vieux-Québec',
  arr: 'La Cité-Limoilou',
  d: 'Le quartier historique, entouré de fortifications. Il est inscrit sur la Liste du patrimoine mondial de l’UNESCO depuis 1985.',
  rep: ['Fortifications', 'Rue Saint-Jean', 'Château Frontenac'],
  vie: "Vivre au cœur du patrimoine : rues pavées, fortifications et animation touristique, surtout l’été.",
  log: "Des logements dans des bâtiments anciens, souvent pleins de cachet, avec des pièces parfois plus petites.",
  pres: ["Terrasse Dufferin", "Quartier Petit Champlain", "Rue Saint-Jean"],
  sav: "Le stationnement est rare et les travaux sur les bâtiments sont encadrés par les règles patrimoniales.",
  hist: ["C’est ici que Samuel de Champlain bâtit l’Habitation en 1608, et que la ville se développe durant ses deux premiers siècles. Le cap Diamant domine le fleuve Saint-Laurent : en haut se trouve la Haute-Ville, et à son pied, sur une bande de terre basse, la Basse-Ville.", "En 1620, Champlain choisit la Haute-Ville pour y installer le fort Saint-Louis. Elle prend dès lors un caractère militaire et administratif, habitée par les militaires, les fonctionnaires et le clergé, tandis que la Basse-Ville se peuple de commerçants et d’artisans.", "Après le départ des troupes britanniques en 1871, le gouverneur général Lord Dufferin lance de grands projets pour préserver le caractère historique de la ville. Le nom « Vieux-Québec » se répand avec le livre de l’historien Pierre-Georges Roy, paru en 1931.", "L’arrondissement historique du Vieux-Québec est créé en 1963, puis inscrit sur la Liste du patrimoine mondial de l’UNESCO le 3 décembre 1985. Depuis 2012, la Loi sur le patrimoine culturel le désigne comme « site patrimonial ». Le Séminaire de Québec, la cathédrale Notre-Dame, le théâtre Capitole et l’église Notre-Dame-des-Victoires y sont classés."],
  portrait: ["Le Vieux-Québec fait partie du quartier Vieux-Québec–Cap-Blanc–Colline parlementaire, dans La Cité-Limoilou. La rue Saint-Jean, la terrasse Dufferin, la place Royale et le quartier du Petit-Champlain en sont des lieux emblématiques.", "Y vivre, c’est habiter un site patrimonial : les bâtiments anciens sont protégés et les travaux y sont encadrés. Le site couvre 1,4 km², fortifications comprises."],
  dates: [["1608", "Champlain bâtit l’Habitation"], ["1620", "Construction du fort Saint-Louis"], ["1871", "Départ des troupes britanniques"], ["1963", "Création de l’arrondissement historique"], ["1985", "Inscription au patrimoine mondial de l’UNESCO"]],
  wiki: "https://fr.wikipedia.org/wiki/Vieux-Québec"
}, {
  s: "la-haute-saint-charles",
  n: "La Haute-Saint-Charles",
  dans: "dans La Haute-Saint-Charles",
  de: "de La Haute-Saint-Charles",
  type: "arrondissement",
  arrT: "Arrondissement",
  arr: "La Haute-Saint-Charles",
  zone: "Ville de Québec",
  d: "Au nord-ouest du centre-ville de Québec, dans la partie haute du bassin de la rivière Saint-Charles. L’arrondissement regroupe Loretteville, Val-Bélair, Lac-Saint-Charles, Saint-Émile et Des Châtels.",
  situe: "Nord de Québec, en amont de la rivière Saint-Charles",
  chiffre: ["Population", "88 460", "habitants au recensement de 2021"],
  rep: ["Lac Saint-Charles", "Parc de la chute Kabir Kouba", "Boulevard Pie-XI"],
  vie: "Un secteur familial et boisé, au pied des Laurentides. Les parcs, les rivières et les sentiers sont à deux pas de la plupart des quartiers.",
  log: "Des bungalows des années 1950 et suivantes, des maisons anciennes le long des premières routes et un tissu plus dense à Loretteville, avec des maisons à mansarde et de style Boomtown.",
  pres: ["Réserve naturelle des Marais-du-Nord", "Mont Bélair", "Wendake"],
  sav: "Le transport en commun est assuré par le Réseau de transport de la Capitale. Le territoire est vaste : vérifiez le trajet vers votre lieu de travail avant de visiter un logement.",
  hist: ["Le peuplement commence en 1647 sur les seigneuries de Saint-Ignace, à l’est, et de Saint-Gabriel, à l’ouest. Les collines et les cours d’eau dictent l’emplacement des fermes, desservies par des chemins qui deviendront la rue Racine, le boulevard Bastien, le boulevard de l’Ormière et l’avenue du Lac-Saint-Charles.", "Autour de Lac-Saint-Charles et de Saint-Émile, le sol pauvre limite l’agriculture. La paroisse de Saint-Ambroise-de-la-Jeune-Lorette devient la ville de Loretteville, centre commercial et institutionnel du secteur. Le travail du cuir, influencé par la proximité de Wendake, et l’énergie des chutes Kabir Kouba font naître une petite industrie.", "Vers 1850, le chemin de fer facilite l’accès au secteur, qui attire les villégiateurs. Les chalets se multiplient, notamment à Château-d’Eau, créé en 1926 puis rattaché à Loretteville en 1965. La première conduite d’eau potable vers Québec, tirée de la rivière Saint-Charles, est posée en 1854, et le château d’eau actuel est bâti en 1949.", "L’arrondissement est créé en 2002, lors des fusions municipales. Il réunit alors Loretteville, Lac-Saint-Charles, Saint-Émile et le nord de Neufchâtel. Le 1er novembre 2009, le secteur de Val-Bélair, auparavant dans l’arrondissement Laurentien, s’y ajoute."],
  portrait: ["La Haute-Saint-Charles est l’un des six arrondissements de la ville de Québec. Son nom vient de sa position dans la partie supérieure du bassin versant de la rivière Saint-Charles. On y trouve le lac Saint-Charles et, à Château-d’Eau près de Loretteville, la prise d’eau qui alimente environ la moitié de la population de Québec. L’arrondissement entoure aussi la communauté huronne-wendat de Wendake.", "Au recensement de 2021, l’arrondissement comptait 88 460 habitants sur environ 148 km². Parmi ses espaces verts, on compte le parc de la Falaise et de la chute Kabir Kouba, la réserve naturelle des Marais-du-Nord, le parc linéaire de la rivière Saint-Charles et le parc naturel du mont Bélair."],
  dates: [["1647", "Début du peuplement des seigneuries"], ["1854", "Première conduite d’eau vers Québec"], ["1949", "Construction du château d’eau"], ["2002", "Création de l’arrondissement"], ["2009", "Val-Bélair se joint à l’arrondissement"]],
  wiki: "https://fr.wikipedia.org/wiki/La_Haute-Saint-Charles"
}, {
  s: "l-ancienne-lorette",
  n: "L’Ancienne-Lorette",
  dans: "à L’Ancienne-Lorette",
  de: "de L’Ancienne-Lorette",
  type: "ville",
  arrT: "MRC",
  arr: "Agglomération de Québec",
  zone: "Rive-Nord",
  d: "Une petite ville entièrement entourée par la ville de Québec, entre les arrondissements des Rivières et de Sainte-Foy–Sillery–Cap-Rouge. L’aéroport international Jean-Lesage se trouve juste à l’ouest.",
  situe: "Rive-Nord, enclavée dans la ville de Québec",
  chiffre: ["Population", "16 970", "habitants au recensement de 2021"],
  rep: ["Église Notre-Dame-de-l’Annonciation", "Rivière Lorette", "Aéroport international Jean-Lesage"],
  vie: "Une ville résidentielle tranquille, avec ses écoles, sa piscine et son aréna. À la mi-août, le Festival Lorettain réunit les familles autour d’un spectacle et de feux d’artifice.",
  log: "Surtout des maisons individuelles, avec des duplex et quelques immeubles de logements.",
  pres: ["Boisé de la rivière Lorette", "AquaGym Élise-Marcotte", "Polyvalente de L’Ancienne-Lorette"],
  sav: "Le transport en commun relève du Réseau de transport de la Capitale, comme dans le reste de l’agglomération. La ville est petite, environ 7,6 km², et l’aéroport est tout près.",
  hist: ["En 1674, le jésuite Pierre Chaumonot fait construire une chapelle là où se trouve le cimetière actuel. Elle dessert les Hurons-Wendats réfugiés près de Québec après la guerre contre les Iroquois. Guéri après un pèlerinage au sanctuaire italien de Lorette, le père Chaumonot place la mission sous le patronage de Notre-Dame de l’Annonciation, et le lieu prend le nom de Lorette.", "En 1697, les Hurons-Wendats s’installent plus loin, à la Jeune-Lorette. Leur ancien village devient la Vieille-Lorette, ou Ancienne-Lorette, et continue de se développer avec des colons français. Au fil du temps, la paroisse perd une partie de son territoire au profit de Saint-Félix-de-Cap-Rouge en 1872, puis de Saint-Gérard-Majella en 1909.", "En 1947, le village se sépare de la paroisse sous le nom de Notre-Dame-de-Lorette. Il obtient le statut de ville en 1967 et reprend le nom d’Ancienne-Lorette. La paroisse, qui comprenait le terrain de l’aéroport, est fusionnée à Sainte-Foy le 1er janvier 1971. En 1987, la ville demande que son nom officiel devienne L’Ancienne-Lorette.", "Le 1er janvier 2002, la ville est fusionnée à Québec. Au référendum du 20 juin 2004, 61,7 % des votants choisissent de la reconstituer. L’Ancienne-Lorette redevient une ville à part entière le 1er janvier 2006, au sein de l’agglomération de Québec."],
  portrait: ["L’Ancienne-Lorette est une ville de la Capitale-Nationale qui fait partie de l’agglomération de Québec. Son territoire de 7,63 km² est complètement enclavé dans la ville de Québec. La rivière Lorette, un affluent de la rivière Saint-Charles, la traverse du nord-ouest vers le sud-est.", "Au recensement de 2021, la ville comptait 16 970 habitants. Ses écoles publiques de langue française relèvent du Centre de services scolaire des Découvreurs, et la ville publie quatre fois par année son journal municipal, Le Lorettain."],
  dates: [["1674", "Chapelle du père Chaumonot"], ["1697", "Départ des Hurons-Wendats vers Jeune-Lorette"], ["1967", "Le village obtient le statut de ville"], ["2002", "Fusion avec la ville de Québec"], ["2006", "Reconstitution de la ville"]],
  wiki: "https://fr.wikipedia.org/wiki/L%27Ancienne-Lorette"
}, {
  s: "saint-augustin-de-desmaures",
  n: "Saint-Augustin-de-Desmaures",
  dans: "à Saint-Augustin-de-Desmaures",
  de: "de Saint-Augustin-de-Desmaures",
  type: "ville",
  arrT: "MRC",
  arr: "Agglomération de Québec",
  zone: "Rive-Nord",
  d: "Sur la rive nord du Saint-Laurent, à l’ouest de Québec. La route 138 sert de rue principale au secteur centre, et l’autoroute 40 traverse la ville d’est en ouest.",
  situe: "Rive-Nord, à l’ouest de Québec",
  chiffre: ["Population", "19 907", "habitants au recensement de 2021"],
  rep: ["Lac Saint-Augustin", "Route 138", "Campus Notre-Dame-de-Foy"],
  vie: "Une banlieue verte où les quartiers résidentiels côtoient encore des terres agricoles. Le lac Saint-Augustin et le fleuve donnent au territoire un caractère de campagne près de la ville.",
  log: "Des maisons unifamiliales dans les quartiers récents, d’anciens chalets transformés en résidences autour du lac et des immeubles en copropriété près des campus.",
  pres: ["Parc des Hauts-Fonds", "Bibliothèque Alain-Grandbois", "Parc industriel François-Leclerc"],
  sav: "La limite est de la ville se trouve à environ 15 km du centre-ville de Québec. Le transport en commun est offert par le Réseau de transport de la Capitale, puisque la ville fait partie de l’agglomération.",
  hist: ["En 1647, la seigneurie de Maur est concédée aux frères Jean Juchereau de Maur et Noël Juchereau Deschatelets. Le peuplement est lent : en 1663, seules trois terres sont concédées. Un moulin banal est bâti en 1672 à la décharge du lac Saint-Augustin, et la paroisse catholique est fondée en 1691.", "Le chemin du Roy traverse la seigneurie à partir de 1716. En 1734, les Sœurs hospitalières de Québec deviennent seigneuresses de Saint-Augustin. Elles le restent jusqu’à l’abolition du régime seigneurial, et les revenus servent à l’entretien de l’Hôtel-Dieu de Québec.", "L’église actuelle est inaugurée en 1816, à environ deux kilomètres au nord du fleuve, sur la route qui deviendra la route 138. Le village garde longtemps son caractère agricole. Vers 1965, plusieurs communautés religieuses bâtissent au sud-ouest du lac un ensemble d’une vingtaine d’édifices blancs, œuvre de l’architecte Jean-Marie Roy.", "La ville prend un caractère de banlieue à partir des années 1960, et le quartier des Bocages se développe vers 1975. Fusionnée à Québec le 1er janvier 2002, Saint-Augustin-de-Desmaures choisit par référendum, le 20 juin 2004, de redevenir une ville distincte. Elle est reconstituée le 1er janvier 2006."],
  portrait: ["Saint-Augustin-de-Desmaures est l’une des trois municipalités de l’agglomération de Québec, avec Québec et L’Ancienne-Lorette. Son territoire longe le Saint-Laurent sur 12,3 km et s’étend sur environ 10 km vers le nord, jusqu’aux premiers versants des Laurentides. La population se concentre dans deux secteurs : le centre, autour de l’ancien village, et le secteur du lac Saint-Augustin et des Bocages, à l’est.", "Au recensement de 2021, la ville comptait 19 907 habitants. Le parc industriel François-Leclerc accueille le siège social de Biscuits Leclerc et de Louis Garneau Sports."],
  dates: [["1647", "Concession de la seigneurie de Maur"], ["1716", "Ouverture du chemin du Roy"], ["1816", "Inauguration de l’église actuelle"], ["2002", "Fusion avec la ville de Québec"], ["2006", "Reconstitution de la ville"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Augustin-de-Desmaures"
}, {
  s: "boischatel",
  n: "Boischatel",
  dans: "à Boischatel",
  de: "de Boischatel",
  type: "ville",
  arrT: "MRC",
  arr: "La Côte-de-Beaupré",
  zone: "Rive-Nord",
  d: "À l’est de Québec, sur la rive est de la rivière Montmorency, là où elle rejoint le Saint-Laurent. L’avenue Royale et le boulevard Sainte-Anne la traversent d’ouest en est.",
  situe: "Rive-Nord, à l’est de Québec",
  chiffre: ["Population", "8 231", "habitants au recensement de 2021"],
  rep: ["Chute Montmorency", "Avenue Royale", "Club de golf Royal Québec"],
  vie: "Une municipalité boisée et résidentielle, bâtie sur un plateau qui domine le fleuve. Les parcs et les sentiers sont nombreux, et l’île d’Orléans se trouve juste en face.",
  log: "Surtout des maisons unifamiliales, dans un secteur construit qui s’étend vers le nord sur environ 4 km.",
  pres: ["Parc de la Chute-Montmorency", "Grottes de Boischatel", "Parc des Résurgences"],
  sav: "Boischatel touche à l’arrondissement de Beauport, à Québec. L’avenue Royale (route 360) et le boulevard Sainte-Anne (route 138) mènent vers la ville.",
  hist: ["Le secteur, d’abord appelé le Sault, est colonisé vers 1664 sur le fief de Charleville. Le territoire reste agricole, mais il ne comptera jamais plus d’une vingtaine de fermes.", "Au XIXe siècle, la chute Montmorency fournit l’énergie à plusieurs entreprises, dont la scierie Patterson, une filature de la Dominion Textile et une centrale hydroélectrique. Au début du XXe siècle, le chemin de fer Montmorency-Charlevoix relie les industries du Sault-Montmorency à Québec.", "Au début des années 1920, le Sault compte environ 550 habitants, soit le tiers de la population de L’Ange-Gardien, dont il fait partie. Le 3 avril 1920, il devient la municipalité de Saint-Jean-de-Boischatel, nommée en l’honneur de Jean-François de Beauchatel, premier aide de camp du général Montcalm.", "En 1925, la création de la paroisse Sainte-Marguerite-Marie coupe les derniers liens avec L’Ange-Gardien. Le 23 novembre 1991, la municipalité prend le nom de Boischatel."],
  portrait: ["Boischatel fait partie de la MRC de La Côte-de-Beaupré, dans la Capitale-Nationale. La municipalité s’articule autour du club de golf Royal Québec, fondé en 1874. Son centre est bâti sur un plateau, à environ 80 m au-dessus du fleuve, et le territoire grimpe jusqu’à 358 m au nord, dans les premières collines des Laurentides.", "Au recensement de 2021, Boischatel comptait 8 231 habitants. La chute Montmorency se trouve en partie sur son territoire, et les grottes de Boischatel, explorées sur environ 3 000 m, sont les plus longues du Canada à l’est des Rocheuses."],
  dates: [["1664", "Début de la colonisation du Sault"], ["1874", "Fondation du club de golf Royal Québec"], ["1920", "Création de Saint-Jean-de-Boischatel"], ["1925", "Création de la paroisse"], ["1991", "La municipalité devient Boischatel"]],
  wiki: "https://fr.wikipedia.org/wiki/Boischatel"
}, {
  s: "lac-beauport",
  n: "Lac-Beauport",
  dans: "à Lac-Beauport",
  de: "de Lac-Beauport",
  type: "ville",
  arrT: "MRC",
  arr: "La Jacques-Cartier",
  zone: "Rive-Nord",
  d: "Au nord de Québec, dans les Laurentides, juste au-dessus des arrondissements de Charlesbourg et de Beauport. Le lac Beauport, au sud du territoire, lui donne son nom.",
  situe: "Rive-Nord, au nord de Charlesbourg",
  chiffre: ["Population", "8 164", "habitants au recensement de 2021"],
  rep: ["Lac Beauport", "Le Relais", "Mont Tourbillon"],
  vie: "Un milieu de villégiature tourné vers le plein air, avec le ski, le vélo de montagne et les sports nautiques. La vie suit les saisons, du tournoi de hockey sur le lac en février au triathlon en juin.",
  log: "Surtout des maisons unifamiliales, souvent sur de grands terrains boisés, ainsi que d’anciens chalets autour des lacs.",
  pres: ["Sentiers du Moulin", "Club nautique et plage publique", "Centre de vacances Cité-Joie"],
  sav: "Le territoire est vallonné et boisé, et les distances entre les secteurs sont grandes. Une voiture facilite les déplacements vers Charlesbourg et le reste de Québec.",
  hist: ["En 1634, le territoire fait partie de la seigneurie de Beauport, concédée à Robert Giffard. Le premier peuplement apparaît vers 1820 sous le nom de Waterloo Settlement. Une bonne partie des colons sont des Irlandais catholiques.", "Une première municipalité, Saint-Dunstan, est créée en 1845, puis démantelée dès 1847. La paroisse de Saint-Dunstan-du-Lac-Beauport est érigée en 1853, et une municipalité de paroisse du même nom suit en 1855.", "Au début du XXe siècle, une quarantaine de familles vivent d’une agriculture de subsistance. Dans les années 1930, le ski alpin change la donne : un premier télésiège est installé en 1938 au mont Saint-Castin. Le village devient un lieu de loisirs pour les gens de Québec, et la population croît vite à partir des années 1970.", "Les habitants et les visiteurs appellent depuis longtemps la municipalité par le nom du lac. En 1989, elle est officiellement renommée Lac-Beauport. En 1991, elle signe un pacte d’amitié avec Sévrier et Le Grand-Bornand, deux communes de la Haute-Savoie, en France."],
  portrait: ["Lac-Beauport fait partie de la MRC de La Jacques-Cartier et de la communauté métropolitaine de Québec. Son territoire de 64 km² se situe à la limite sud du massif du lac Jacques-Cartier, entre des collines comme la montagne des Ormes, le mont Tourbillon et le mont Écho. La rivière Jaune en est le principal cours d’eau.", "Au recensement de 2021, la municipalité comptait 8 164 habitants. Le centre de ski Le Relais compte 27 pistes, et les Sentiers du Moulin offrent environ 50 km de ski de fond et 30 km de vélo de montagne."],
  dates: [["1634", "Concession de la seigneurie de Beauport"], ["1855", "Création de la municipalité de paroisse"], ["1938", "Premier télésiège au mont Saint-Castin"], ["1962", "Ouverture du golf du Mont-Tourbillon"], ["1989", "La municipalité devient Lac-Beauport"]],
  wiki: "https://fr.wikipedia.org/wiki/Lac-Beauport"
}, {
  s: "stoneham-et-tewkesbury",
  n: "Stoneham-et-Tewkesbury",
  dans: "à Stoneham-et-Tewkesbury",
  de: "de Stoneham-et-Tewkesbury",
  type: "ville",
  arrT: "MRC",
  arr: "La Jacques-Cartier",
  zone: "Rive-Nord",
  d: "Au nord de Québec, dans les Laurentides, le long de la route 175 qui mène au Saguenay–Lac-Saint-Jean. La Station touristique Stoneham et une partie du parc national de la Jacques-Cartier se trouvent sur son territoire.",
  situe: "Laurentides, à 25 km au nord de Québec",
  chiffre: ["Population", "9 682", "habitants au recensement de 2021"],
  rep: ["Station touristique Stoneham", "Parc national de la Jacques-Cartier", "Parc de la forêt ancienne du mont Wright"],
  vie: "Une municipalité de plein air, entourée de montagnes, de lacs et de rivières. Le village et le secteur du complexe municipal regroupent l’école, l’église, l’épicerie, la pharmacie et la clinique médicale.",
  log: "Surtout des maisons individuelles, où vit la grande majorité des habitants. On trouve aussi des condos près du centre de ski, des chalets et quelques parcs de maisons mobiles.",
  pres: ["Réserve faunique des Laurentides", "Parc naturel des Marais du Nord", "Club de golf Stoneham"],
  sav: "La route 175, aménagée en autoroute jusqu’à Stoneham, mène au centre-ville de Québec en une vingtaine de minutes. Le Transport collectif de La Jacques-Cartier (TCJC) relie aussi la municipalité à Québec et à l’Université Laval.",
  hist: ["Les Innus, autrefois appelés Montagnais, chassaient et pêchaient sur ce territoire, aussi fréquenté par les Hurons établis à Wendake. Au XVIIe siècle, le sentier des Jésuites le traversait du sud au nord pour rejoindre le lac Saint-Jean par les rivières et les portages. Des fouilles aux Marais du Nord ont révélé des traces de présence autochtone remontant à l’an 500.", "En 1764, Kenelm Chandler, originaire de Tewkesbury en Angleterre, obtient des terres dans la région, qu’il n’occupera jamais. En 1790, le pasteur anglican Philip Toosey reçoit une vaste terre à Stoneham et y bâtit la première ferme en 1794. Des familles irlandaises, anglaises et écossaises s’installent dans le canton entre 1815 et 1825. En 1855, la municipalité prend le nom de cantons unis de Stoneham-et-Tewkesbury.", "Pendant près d’un siècle, la forêt fait vivre la population. Un chemin de fer relie Stoneham à Loretteville en 1912, et jusqu’à 20 moulins à scie fonctionnent sur le territoire. La route 175, achevée en 1951, ouvre la région aux automobilistes et aux villégiateurs. Le club de golf voit le jour en 1959 et la Station touristique Stoneham en 1963.", "En 1973, le village de Saint-Adolphe est annexé à la municipalité. La fermeture des installations de Domtar en 1975 marque la fin de l’ère forestière. Le parc national de la Jacques-Cartier est créé en 1981 et le parc des Marais du Nord est inauguré en 1995. Grâce à l’autoroute, Stoneham est aujourd’hui à une vingtaine de minutes du centre-ville de Québec."],
  portrait: ["Stoneham-et-Tewkesbury est une municipalité de cantons unis de la MRC de La Jacques-Cartier, à environ 25 km du centre-ville de Québec. Son territoire de plus de 680 km² compte de nombreux lacs et des monts de 700 à 900 m, dont les monts Wright et Hibou. La population vit surtout dans les vallées des rivières des Hurons, Hibou et Jacques-Cartier. Le secteur de Saint-Adolphe s’y est ajouté en 1973.", "Au recensement de 2021, la municipalité comptait 9 682 habitants, contre 5 266 en 2001. La Station touristique Stoneham, le club de golf et les parcs font du récréotourisme sa principale activité économique. Les chalets en été et les condos du centre de ski en hiver ajoutent environ 2 000 résidents saisonniers."],
  dates: [["1764", "Terres concédées à Kenelm Chandler"], ["1855", "Création des cantons unis"], ["1912", "Chemin de fer vers Loretteville"], ["1963", "Ouverture de la Station touristique Stoneham"], ["1981", "Création du parc de la Jacques-Cartier"]],
  wiki: "https://fr.wikipedia.org/wiki/Stoneham-et-Tewkesbury"
}, {
  s: "sainte-brigitte-de-laval",
  n: "Sainte-Brigitte-de-Laval",
  dans: "à Sainte-Brigitte-de-Laval",
  de: "de Sainte-Brigitte-de-Laval",
  type: "ville",
  arrT: "MRC",
  arr: "La Jacques-Cartier",
  zone: "Rive-Nord",
  d: "Au nord-est de Québec, dans la vallée de la rivière Montmorency. L’avenue Sainte-Brigitte la traverse du nord au sud et forme son seul accès direct vers Québec.",
  situe: "Vallée de la Montmorency, au nord-est de Québec",
  chiffre: ["Croissance", "29 %", "de hausse de la population entre 2011 et 2016"],
  rep: ["Rivière Montmorency", "Lac Poulin", "Avenue Sainte-Brigitte"],
  vie: "Une ville en forte croissance, entourée de montagnes et de forêts. La vie se concentre dans la vallée, le long de la rivière Montmorency.",
  log: "Surtout des maisons récentes. Depuis le début des années 2000, des dizaines de rues ont été ouvertes pour des habitations neuves, souvent spacieuses.",
  pres: ["Club de golf Alpin", "Centre récréotouristique des Hautes-Terres", "Lac-Beauport"],
  sav: "Le centre de Québec est à une trentaine de kilomètres par l’avenue Sainte-Brigitte. La Traverse de Laval offre un second lien routier, vers Lac-Beauport à l’ouest.",
  hist: ["Les premiers habitants du territoire sont des Irlandais arrivés vers 1830. Une mission est fondée en 1837 et une chapelle est construite en 1842. Une église la remplace en 1853.", "En 1863, la paroisse est érigée sous le patronage de sainte Brigitte d’Irlande, en souvenir de l’origine des premiers colons. Le nom Laval rappelle la seigneurie de Beaupré, dont le premier propriétaire était François de Montmorency-Laval, évêque de Québec. Les Canadiens français, arrivés après les Irlandais, deviennent majoritaires vers 1871.", "Grâce à sa position sur la rivière Montmorency, la localité profite des travaux forestiers menés sur les terres du Séminaire de Québec. À la fin des années 1940, huit scieries sont établies sur son territoire. L’église actuelle date de 1949.", "Au début des années 2000, l’étalement urbain de Québec atteint Sainte-Brigitte-de-Laval, qui mise sur le développement résidentiel. Des dizaines de rues s’ouvrent pour accueillir des maisons neuves. La municipalité obtient le statut de ville le 8 décembre 2012."],
  portrait: ["Sainte-Brigitte-de-Laval fait partie de la MRC de La Jacques-Cartier, dans la Capitale-Nationale. Son secteur habité s’étend sur la rive ouest de la rivière Montmorency, à environ 250 m d’altitude, au pied de sommets qui dépassent parfois 700 m. Le lac Poulin est le plus grand plan d’eau de son territoire d’environ 110 km².", "La ville comptait 8 468 habitants au recensement de 2021, plus du double des 3 790 recensés en 2006. Entre 2011 et 2016, sa population a augmenté de 29 %, la plus forte hausse au Québec parmi les municipalités de taille comparable."],
  dates: [["1830", "Arrivée des premiers colons irlandais"], ["1837", "Fondation de la première mission"], ["1863", "Érection de la paroisse Sainte-Brigitte"], ["1949", "Construction de l’église actuelle"], ["2012", "Sainte-Brigitte-de-Laval devient une ville"]],
  wiki: "https://fr.wikipedia.org/wiki/Sainte-Brigitte-de-Laval"
}, {
  s: "sainte-catherine-de-la-jacques-cartier",
  n: "Sainte-Catherine-de-la-Jacques-Cartier",
  dans: "à Sainte-Catherine-de-la-Jacques-Cartier",
  de: "de Sainte-Catherine-de-la-Jacques-Cartier",
  type: "ville",
  arrT: "MRC",
  arr: "La Jacques-Cartier",
  zone: "Rive-Nord",
  d: "À une vingtaine de kilomètres à l’ouest de Québec, de part et d’autre de la rivière Jacques-Cartier. La route 367 (route de Fossambault) la relie à l’autoroute 40.",
  situe: "Rivière Jacques-Cartier, à l’ouest de Québec",
  chiffre: ["Population", "8 442", "habitants au recensement de 2021"],
  rep: ["Rivière Jacques-Cartier", "Chemin de la Liseuse", "Station touristique Duchesnay"],
  vie: "Une petite ville tournée vers le plein air, entre rivière, forêt et terres agricoles. Les pistes cyclables l’été et le parc de glisse du Grand-Héron l’hiver attirent les familles.",
  log: "Les secteurs résidentiels se trouvent surtout au centre-ville, au nord, et dans les développements de Parc-Bon-Air et de Place-Laurentienne, au sud. Le Faubourg Sainte-Catherine, lancé en 2014, est un quartier écologique de 29 terrains.",
  pres: ["Parc de glisse du Grand-Héron", "Centre socioculturel Anne-Hébert", "Lac Saint-Joseph"],
  sav: "La route 367 rejoint l’autoroute 40 une dizaine de kilomètres au sud, et la route 369 mène à Shannon. À vélo, la piste Jacques-Cartier/Portneuf rejoint le Corridor des Cheminots vers Québec.",
  hist: ["Le 20 février 1693, le gouverneur Frontenac concède à Alexandre Peuvret la seigneurie de Fossambault, nommée en l’honneur de sa mère, Marie-Catherine Nau de Fossambault. La seigneurie passe ensuite à la famille Juchereau Duchesnay. Elle ne se développe vraiment qu’avec Michel-Louis Juchereau Duchesnay, héros de la bataille de Châteauguay.", "En octobre 1820, Duchesnay invite des immigrants irlandais à s’établir sur ses terres, où naît le St Patrick Settlement. Il y fait construire un manoir et un moulin banal. La paroisse catholique de Sainte-Catherine est fondée en 1824 et la municipalité est constituée en 1855.", "En 1912, le ministère de la Milice acquiert des terres à Sainte-Catherine de Portneuf pour y établir le camp militaire de Valcartier, ce qui entraîne l’expropriation de 125 cultivateurs de Sainte-Catherine et de Saint-Gabriel-de-Valcartier. Le territoire est aussi morcelé au fil des ans : Lac-Sergent en 1921, Lac-Saint-Joseph en 1936, Shannon en 1946 et Fossambault-sur-le-Lac en 1949 deviennent des municipalités distinctes.", "Avec la création de la MRC de La Jacques-Cartier, la municipalité prend le nom de Sainte-Catherine-de-la-Jacques-Cartier en 1984. Elle devient une ville en 2000. Depuis le début des années 2000, sa population augmente rapidement."],
  portrait: ["Sainte-Catherine-de-la-Jacques-Cartier fait partie de la MRC de La Jacques-Cartier, dans la Capitale-Nationale. Son territoire de 122,7 km² s’étend des deux côtés de la rivière Jacques-Cartier. L’agriculture occupe les rives et la forêt couvre le reste, jusqu’aux collines laurentiennes où le mont Bélair atteint 410 m dans les limites de la ville.", "La population est passée de 4 681 habitants en 2001 à 8 442 en 2021. La ville compte deux écoles primaires, une école secondaire qui accueille les élèves jusqu’en 2e secondaire et une maison des jeunes. L’hiver, le parc de glisse du Grand-Héron aménage un anneau de glace de 2,7 km en forêt."],
  dates: [["1693", "Concession de la seigneurie de Fossambault"], ["1820", "Arrivée de colons irlandais"], ["1824", "Fondation de la paroisse Sainte-Catherine"], ["1912", "Création du camp militaire de Valcartier"], ["1984", "Adoption du nom actuel"]],
  wiki: "https://fr.wikipedia.org/wiki/Sainte-Catherine-de-la-Jacques-Cartier"
}, {
  s: "shannon",
  n: "Shannon",
  dans: "à Shannon",
  de: "de Shannon",
  type: "ville",
  arrT: "MRC",
  arr: "La Jacques-Cartier",
  zone: "Rive-Nord",
  d: "À environ 25 km au nord-ouest de Québec, sur la rivière Jacques-Cartier, près de la base des Forces canadiennes Valcartier. Shannon est le chef-lieu de la MRC de La Jacques-Cartier.",
  situe: "Banlieue, au nord-ouest de Québec",
  chiffre: ["Population", "6 432", "habitants au recensement de 2021"],
  rep: ["Rivière Jacques-Cartier", "Rivière aux Pins", "Parc municipal de Shannon"],
  vie: "Une ville résidentielle en banlieue de Québec, traversée par la rivière Jacques-Cartier et la rivière aux Pins. Son nom rappelle les origines irlandaises de sa population.",
  log: "Un milieu résidentiel qui s’est beaucoup développé ces dernières années : la population est passée de 3 825 habitants en 2006 à 6 432 en 2021.",
  pres: ["Base des Forces canadiennes Valcartier", "Sainte-Catherine-de-la-Jacques-Cartier", "Zec de la Rivière-Jacques-Cartier"],
  sav: "Shannon est à environ 25 km du centre de Québec. La route 369 la relie à Sainte-Catherine-de-la-Jacques-Cartier.",
  hist: ["Le territoire de Shannon faisait autrefois partie de Sainte-Catherine, où des immigrants irlandais s’installent à partir de 1820 à l’invitation du seigneur Michel-Louis Juchereau Duchesnay. Le nom de la ville rappelle cette origine irlandaise. Pendant longtemps, la coupe du bois destiné aux chantiers navals de Québec fait vivre la population.", "En 1912, le ministère de la Milice acquiert des terres à Sainte-Catherine de Portneuf et à Saint-Gabriel-de-Valcartier pour y créer le camp militaire de Valcartier. Des cultivateurs, pour la plupart d’ascendance irlandaise, doivent alors quitter les terres que leurs ancêtres avaient défrichées.", "Le 14 décembre 1946, une partie de Sainte-Catherine de Portneuf s’en détache pour former la municipalité de Shannon. Les résidents du secteur contestaient les taxes municipales et le manque de services. En 1964, une deuxième expropriation fédérale agrandit la base militaire et Shannon perd les concessions 7 à 12."],
  portrait: ["Shannon est le chef-lieu de la MRC de La Jacques-Cartier, dans la Capitale-Nationale. Son territoire de 64,8 km² est traversé du nord au sud par la rivière Jacques-Cartier et du nord-est au sud-ouest par la rivière aux Pins. La base des Forces canadiennes Valcartier se trouve à proximité.", "La ville comptait 6 432 habitants au recensement de 2021, contre 3 825 en 2006. Le maire et les six conseillers sont élus en bloc."],
  dates: [["1820", "Arrivée de colons irlandais dans la région"], ["1912", "Création du camp militaire de Valcartier"], ["1946", "Création de la municipalité de Shannon"], ["1964", "Agrandissement de la base de Valcartier"], ["2017", "Shannon obtient le statut de ville"]],
  wiki: "https://fr.wikipedia.org/wiki/Shannon_(Qu%C3%A9bec)"
}, {
  s: "levis",
  n: "Lévis",
  dans: "à Lévis",
  de: "de Lévis",
  type: "ville",
  arrT: "Région",
  arr: "Chaudière-Appalaches",
  zone: "Rive-Sud",
  d: "Sur la rive sud du Saint-Laurent, en face de Québec. Le boulevard Guillaume-Couture (route 132) en est la principale artère commerciale.",
  situe: "Rive-Sud, en face de Québec",
  chiffre: ["Population", "149 683", "habitants au recensement de 2021"],
  rep: ["Boulevard Guillaume-Couture", "Maison Alphonse-Desjardins", "Parc de la chute de la rivière Chaudière"],
  vie: "Une grande ville aux visages variés, avec des secteurs anciens près du fleuve, des quartiers résidentiels plus récents et beaucoup de terres agricoles au sud.",
  log: "On y trouve des maisons unifamiliales, des plex dans les secteurs plus anciens et des immeubles locatifs le long des grands axes, comme la route du Président-Kennedy.",
  pres: ["Galeries Chagnon", "Cégep de Lévis", "Hôtel-Dieu de Lévis"],
  sav: "La Société de transport de Lévis dessert toute la ville, avec des trajets vers l’Université Laval et la colline Parlementaire. Le pont de Québec et le pont Pierre-Laporte relient l’ouest de la ville à la Rive-Nord.",
  hist: ["En 1629, Champlain nomme l’endroit cap de Lévy, en hommage à Henri de Lévis, vice-roi de la Nouvelle-France. La seigneurie de Lauzon est créée en 1636. En 1647, Guillaume Couture, charpentier et interprète auprès des nations autochtones, y reçoit une terre et devient le premier colon de la Pointe-Lévy.", "Les troupes anglaises envahissent la Pointe-Lévy en 1690, puis de nouveau en 1759. Cet été-là, des canons britanniques installés sur les falaises bombardent Québec pendant 70 jours. À partir de 1832, les chantiers Davie construisent des navires sur la rive.", "La seigneurie est démantelée en 1836, après la faillite de John Caldwell, et plusieurs villages naissent sur la Rive-Sud. La ville de Lévis est fondée le 18 mai 1861, à l’initiative du curé Joseph-David Déziel. Son nom honore François Gaston de Lévis, héros de la bataille de Sainte-Foy en 1760. Dans les années 1860, les Britanniques y bâtissent trois forts pour protéger Québec et son port.", "En 1900, Alphonse Desjardins fonde à Lévis le mouvement coopératif qui porte son nom. La ville fusionne avec Lauzon en 1989, puis avec Saint-David-de-l’Auberivière en 1990. Le 1er janvier 2002, neuf autres municipalités, dont Saint-Romuald, Charny et Saint-Nicolas, s’y joignent pour former le Lévis actuel."],
  portrait: ["Lévis s’étend sur la rive sud du fleuve Saint-Laurent, face à Québec, entre Beaumont et Saint-Antoine-de-Tilly. C’est le chef-lieu de la Chaudière-Appalaches et la septième ville la plus peuplée du Québec. Elle compte trois arrondissements et dix secteurs, dont Saint-Romuald, Charny, Saint-Nicolas et Lauzon. Le commerce se concentre surtout le long des boulevards Guillaume-Couture, Alphonse-Desjardins et du Président-Kennedy.", "Au recensement de 2021, la ville comptait 149 683 habitants. Près de la moitié de son territoire de 444 km² est cultivée, et la forêt en couvre plus du tiers. Le Mouvement Desjardins, fondé à Lévis en 1900, figure parmi les grands employeurs de la région, et le chantier Davie, à Lauzon, est actif depuis 1832."],
  dates: [["1636", "Création de la seigneurie de Lauzon"], ["1647", "Guillaume Couture s’établit à la Pointe-Lévy"], ["1861", "Fondation de la ville de Lévis"], ["1900", "Fondation du Mouvement Desjardins"], ["2002", "Fusion avec neuf municipalités voisines"]],
  wiki: "https://fr.wikipedia.org/wiki/Lévis"
}, {
  s: "saint-henri",
  n: "Saint-Henri",
  dans: "à Saint-Henri",
  de: "de Saint-Henri",
  type: "ville",
  arrT: "MRC",
  arr: "Bellechasse",
  zone: "Rive-Sud",
  d: "Village de la MRC de Bellechasse, à environ 15 km de Lévis. La route du Président-Kennedy (route 173) le traverse en direction de la Beauce.",
  situe: "Rive-Sud, au sud de Lévis",
  chiffre: ["Population", "5 813", "habitants au recensement de 2021"],
  rep: ["Église de Saint-Henri", "Rivière Etchemin", "Route du Président-Kennedy"],
  vie: "Un milieu semi-rural, proche des services de Lévis, entouré de terres, de rivières et de cabanes à sucre.",
  log: "Surtout des maisons unifamiliales, avec quelques duplex et petits immeubles près du cœur du village.",
  pres: ["Centre récréatif et aréna", "Parc Fleurbec", "Bibliothèque municipale"],
  sav: "Le village est à environ 15 km de Lévis et 30 km de Québec. Les routes 173, 218, 275 et 277 le relient à la Beauce, à Bellechasse et à Lévis.",
  hist: ["En 1759, pendant l’invasion britannique, le curé Charles d’Youville Dufrost se réfugie à Saint-Henri avec 287 paroissiens de Saint-Joseph-de-la-Pointe-Lévy.", "La municipalité de paroisse de Saint-Henri est créée en 1855, et celle du village en 1913. Le nom honore l’empereur Henri II du Saint-Empire. L’église actuelle est construite en 1879. Elle abrite des statues de bois du sculpteur Louis Jobin et, depuis 1939, un orgue Casavant.", "En 1975, la paroisse et le village fusionnent. L’année suivante, cette nouvelle municipalité s’unit à Rivière-Boyer, créée en 1922, pour former le Saint-Henri d’aujourd’hui.", "En 2000, Saint-Henri est rattachée à la MRC de Bellechasse, dont elle devient la municipalité la plus peuplée. Yvon Bruneau en est le maire de 2001 à 2017. Le ministère des Transports réaménage ensuite le réseau routier du village et prévoit d’élargir la route 173 vers Pintendre."],
  portrait: ["Saint-Henri, aussi appelée Saint-Henri-de-Lévis, est la municipalité la plus peuplée de la MRC de Bellechasse. Elle touche Lévis au nord et la MRC de La Nouvelle-Beauce à l’ouest. La rivière Etchemin la traverse du sud au nord, et le pont Édouard-Brochu la franchit au village. La rivière Boyer passe dans l’est du territoire.", "Au recensement de 2021, Saint-Henri comptait 5 813 habitants. Le village offre un centre récréatif avec aréna, une bibliothèque, une piste cyclable et des sentiers de ski de fond. Son parc industriel, rue de la Gare, accueille notamment une usine d’Olymel."],
  dates: [["1759", "Refuge de 287 paroissiens de la Pointe-Lévy"], ["1855", "Création de la paroisse de Saint-Henri"], ["1879", "Construction de l’église actuelle"], ["1976", "Fusion avec Rivière-Boyer"], ["2000", "Rattachement à la MRC de Bellechasse"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Henri_(Québec)"
}, {
  s: "saint-lambert-de-lauzon",
  n: "Saint-Lambert-de-Lauzon",
  dans: "à Saint-Lambert-de-Lauzon",
  de: "de Saint-Lambert-de-Lauzon",
  type: "ville",
  arrT: "MRC",
  arr: "La Nouvelle-Beauce",
  zone: "Rive-Sud",
  d: "De part et d’autre de la rivière Chaudière, à environ 20 km au sud de Québec. L’autoroute Robert-Cliche (73) la traverse du nord au sud.",
  situe: "Rive-Sud, au sud de Lévis",
  chiffre: ["Population", "6 817", "habitants au recensement de 2021"],
  rep: ["Rivière Chaudière", "Rue du Pont", "Parc Alexis-Blanchet"],
  vie: "Une municipalité calme, entre champs et forêts, avec un noyau villageois autour de la rue du Pont et des secteurs résidentiels au bord de la Chaudière.",
  log: "Surtout des maisons unifamiliales, réparties entre le village et les secteurs Domaine-des-Érables, Place-des-Îles et Parc-Boutin.",
  pres: ["Centre de loisirs", "École primaire du Bac", "Autoroute Robert-Cliche"],
  sav: "L’autoroute Robert-Cliche (73) est le principal accès routier. Elle mène à Lévis, au nord, puis à Québec par le pont Pierre-Laporte.",
  hist: ["Le nom de la municipalité rappelle Pierre Lambert, l’arpenteur qui dresse les plans de la seigneurie de Lauzon en 1828, puis ceux de la ville d’Aubigny, aujourd’hui dans Lévis, en 1848. Lauzon fait référence à la seigneurie de Jean de Lauzon.", "La paroisse catholique de Saint-Lambert est érigée canoniquement le 30 mai 1851. La municipalité de paroisse de Saint-Lambert de Lauzon voit le jour le 1er juillet 1855.", "Le 15 mars 1969, la municipalité de paroisse prend le nom de Saint-Lambert-de-Lauzon. Le 22 juin 2013, elle change de statut et devient une municipalité.", "La croissance de la population mène à l’agrandissement de l’école primaire du Bac en 2012. En 2017, la paroisse catholique est fusionnée avec des paroisses de Lévis, dont celles de Saint-Romuald et de Charny, pour former la paroisse Saint-Jean-l’Évangéliste."],
  portrait: ["Saint-Lambert-de-Lauzon s’étend sur près de 110 km², de part et d’autre de la rivière Chaudière. Sa population se répartit entre le village, le secteur boisé de Parc-Boutin à l’ouest, et les secteurs Domaine-des-Érables et Place-des-Îles, au bord de la Chaudière. Le reste du territoire, plutôt plat, est occupé par l’agriculture et la forêt.", "Au recensement de 2021, la municipalité comptait 6 817 habitants. Rue du Pont, le Centre de loisirs et le parc Alexis-Blanchet regroupent terrains de baseball, de tennis et de pickleball, patinoires et parc de planches à roulettes."],
  dates: [["1851", "Érection canonique de la paroisse"], ["1855", "Création de la municipalité de paroisse"], ["1969", "Adoption du nom Saint-Lambert-de-Lauzon"], ["2013", "Changement de statut en municipalité"], ["2017", "Paroisse fusionnée avec celles de Lévis"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Lambert-de-Lauzon"
}, {
  s: "saint-apollinaire",
  n: "Saint-Apollinaire",
  dans: "à Saint-Apollinaire",
  de: "de Saint-Apollinaire",
  type: "ville",
  arrT: "MRC",
  arr: "Lotbinière",
  zone: "Rive-Sud",
  d: "Municipalité de la MRC de Lotbinière, juste à l’ouest de Lévis. L’autoroute Jean-Lesage (20) la traverse d’est en ouest.",
  situe: "Rive-Sud, à l’ouest de Lévis",
  chiffre: ["Croissance", "30 %", "de hausse de population entre 2016 et 2021"],
  rep: ["Église de Saint-Apollinaire", "Autoroute Jean-Lesage (20)", "Rivière Aulneuse"],
  vie: "Une municipalité en forte croissance, où le village côtoie encore des fermes et des terres agricoles.",
  log: "Surtout des maisons unifamiliales, auxquelles se sont ajoutés des immeubles plus récents avec la croissance des dernières années.",
  pres: ["Centre multifonctionnel", "Bibliothèque municipale", "Clinique médicale"],
  sav: "La voiture est le principal moyen de transport. L’Express vers Sainte-Foy passe par Saint-Apollinaire et permet de rejoindre Québec et Lévis en transport en commun.",
  hist: ["En 1738, Angélique Le Gardeur, fille du seigneur de Tilly, reçoit une seigneurie au sud de celle de Tilly. Elle la nomme seigneurie de Gaspé, d’après son défunt mari. En 1806, une route ouverte entre Saint-Nicolas et Saint-Gilles favorise le développement du territoire.", "Saint-Apollinaire se détache de Saint-Antoine-de-Tilly en 1845. La paroisse est érigée canoniquement le 23 novembre 1853, et l’abolition du régime seigneurial, en 1854, fait disparaître la seigneurie de Gaspé. L’église, conçue par François-Xavier et Prime Béland, est inaugurée le 20 septembre 1858.", "Le chemin de fer arrive en 1897 et fait du village un lieu de passage pour les voyageurs et les marchandises. Le téléphone suit en 1905. En 1919, le village de Francoeur se sépare de la paroisse.", "Dans les années 1960, la route transcanadienne, aujourd’hui l’autoroute 20, attire des entreprises et des travailleurs qui s’installent avec leur famille. Le 6 avril 1974, Saint-Apollinaire et Francoeur fusionnent pour former la municipalité actuelle. La population passe de 2 560 personnes en 1977 à 7 968 en 2021."],
  portrait: ["Saint-Apollinaire est la municipalité la plus peuplée de la MRC de Lotbinière. Elle couvre environ 96 km² et touche Lévis à l’est. Elle se trouve à une vingtaine de kilomètres des ponts de Québec par l’autoroute 20, et la route 273 la traverse du nord au sud.", "Au recensement de 2021, elle comptait 7 968 habitants, soit 30 % de plus qu’en 2016. C’était la plus forte hausse au Québec parmi les municipalités de plus de 5 000 habitants. On y trouve deux écoles primaires, une clinique médicale et une pharmacie."],
  dates: [["1738", "Création de la seigneurie de Gaspé"], ["1853", "Érection canonique de la paroisse"], ["1858", "Inauguration de l’église"], ["1897", "Arrivée du chemin de fer"], ["1974", "Fusion avec le village de Francoeur"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Apollinaire_(Québec)"
}, {
  s: "sainte-marie",
  n: "Sainte-Marie",
  dans: "à Sainte-Marie",
  de: "de Sainte-Marie",
  type: "ville",
  arrT: "MRC",
  arr: "La Nouvelle-Beauce",
  zone: "Rive-Sud",
  d: "En Beauce, à environ 40 km au sud de Québec, sur les deux rives de la rivière Chaudière. L’autoroute 73 et la route 173 la traversent du nord au sud.",
  situe: "Beauce, à environ 40 km au sud de Québec",
  chiffre: ["Population", "13 134", "habitants au recensement de 2021"],
  rep: ["Rivière Chaudière", "Domaine Taschereau", "Maison J.-A. Vachon"],
  vie: "Une ville active et bien équipée, au cœur de La Nouvelle-Beauce, où l’industrie et l’agriculture se côtoient.",
  log: "Surtout des maisons unifamiliales et des jumelés, avec des duplex et de petits immeubles à logements près du centre-ville.",
  pres: ["Cégep Beauce-Appalaches, campus de Sainte-Marie", "Polyvalente Benoit-Vachon", "Route Verte 6"],
  sav: "Le centre-ville longe la rivière Chaudière, qui a débordé en 2019. Avant de signer un bail, demandez si le logement se trouve en zone inondable.",
  hist: ["La seigneurie de Sainte-Marie est concédée en 1736 à Thomas-Jacques Taschereau. Son nom honore son épouse, Marie-Claire Fleury de La Gorgendière. La paroisse est fondée l’année suivante, en 1737. La plupart des premiers colons arrivent de l’île d’Orléans et de la Côte-de-Beaupré.", "La paroisse est érigée canoniquement en 1835, puis la municipalité de Sainte-Marie-de-Beauce voit le jour le 1er juillet 1845. En 1913, la partie la plus urbanisée, le village, se sépare de la paroisse.", "En 1922, l’entreprise Vachon est fondée à Sainte-Marie, qui devient connue comme la ville des gâteaux Vachon. Le village obtient le statut de ville en 1958. Le premier parc industriel ouvre en 1971, et la ville et la paroisse se réunissent en 1978.", "Un second parc industriel ouvre en 1999, du côté est. En avril 2019, une inondation printanière majeure frappe le centre-ville, et des centaines d’habitations doivent ensuite être démolies."],
  portrait: ["Sainte-Marie est le chef-lieu de la MRC de La Nouvelle-Beauce, dans la région de Chaudière-Appalaches. La rivière Chaudière la traverse et marque fortement son paysage. Environ 70 % du territoire sert à l’agriculture. L’autoroute 73, la route 173 et la Route verte 6, pour les cyclistes, la relient au reste de la Beauce et à Québec.", "Au recensement de 2021, la ville comptait 13 134 habitants, ce qui en fait la deuxième ville de la Beauce après Saint-Georges. Ses deux parcs industriels, en bordure de l’autoroute 73, regroupent environ 60 % des emplois industriels de la MRC. On y trouve aussi une polyvalente, un campus collégial, un aréna, une bibliothèque et des piscines intérieure et extérieure."],
  dates: [["1736", "Concession de la seigneurie Taschereau"], ["1845", "Création de la municipalité"], ["1922", "Fondation de l’entreprise Vachon"], ["1978", "Réunion de la ville et de la paroisse"], ["2019", "Inondation majeure au centre-ville"]],
  wiki: "https://fr.wikipedia.org/wiki/Sainte-Marie_(Québec)"
}, {
  s: "donnacona",
  n: "Donnacona",
  dans: "à Donnacona",
  de: "de Donnacona",
  type: "ville",
  arrT: "MRC",
  arr: "Portneuf",
  zone: "Portneuf",
  d: "Sur la rive nord du Saint-Laurent, à l’embouchure de la rivière Jacques-Cartier, à l’ouest de Québec. L’autoroute 40 longe la ville, et le Chemin du Roy la traverse.",
  situe: "Rive-Nord, à l’ouest de Québec dans Portneuf",
  chiffre: ["Population", "7 436", "habitants au recensement de 2021"],
  rep: ["Rivière Jacques-Cartier", "Église Sainte-Agnès", "Chemin du Roy"],
  vie: "Une petite ville au bord du fleuve, au rythme tranquille, qui sert de point de services pour plusieurs villages de Portneuf.",
  log: "Surtout des maisons unifamiliales, avec des duplex et de petits immeubles à logements près des rues principales.",
  pres: ["Rivière aux Pommes", "Parc industriel de Donnacona", "Pont-Rouge"],
  sav: "L’autoroute 40 relie Donnacona à Québec vers l’est. Une voiture reste le moyen le plus simple de se déplacer dans Portneuf.",
  hist: ["En 1672, l’intendant Jean Talon concède à Toussaint Toupin et à son fils Jean la seigneurie de la Pointe-aux-Écureuils. La ville porte aujourd’hui le nom de Donnacona, chef iroquoien dont Jacques Cartier a décrit le village de Stadaconé en 1535, près de l’actuelle ville de Québec.", "En 1912, l’arrivée de la papetière Donnacona Paper entraîne une croissance rapide. La municipalité de Donnacona est fondée en 1915, détachée de Saint-Jean-Baptiste-des-Écureuils. Au plus fort de l’activité, plus de 1 500 hommes travaillent dans les usines, et le New York Times est imprimé sur leur papier.", "En 1924, un couvent est construit. Des religieuses enseignent aux filles à l’école Sainte-Agnès, et des frères aux garçons au collège Sacré-Cœur. En 1967, Donnacona fusionne avec la municipalité des Écureuils. Le 24 juillet de la même année, le général de Gaulle y fait la première halte de son trajet sur le Chemin du Roy et prononce un court discours.", "Le 31 janvier 2008, la papetière, devenue Abitibi-Bowater, arrête sa production, et la fermeture devient permanente. La démolition de l’usine commence à la fin de mars 2011. La ville reste un centre de services pour la région de Portneuf."],
  portrait: ["Donnacona se trouve dans la MRC de Portneuf, sur la rive nord du fleuve Saint-Laurent. La rivière Jacques-Cartier borde le nord-ouest de la ville jusqu’à son embouchure, et la rivière aux Pommes traverse le centre d’est en ouest. Ses voisines sont Pont-Rouge au nord, Cap-Santé à l’ouest et Neuville à l’est.", "Au recensement de 2021, la ville comptait 7 436 habitants sur 37,3 km². Plusieurs organismes régionaux y ont leurs bureaux, dont le Centre local d’emploi et le Carrefour jeunesse emploi de Portneuf. Un parc industriel s’étend en bordure de l’autoroute 40."],
  dates: [["1672", "Seigneurie de la Pointe-aux-Écureuils"], ["1912", "Arrivée de la Donnacona Paper"], ["1915", "Fondation de la municipalité"], ["1967", "Fusion avec Les Écureuils"], ["2008", "Fermeture de la papetière"]],
  wiki: "https://fr.wikipedia.org/wiki/Donnacona_(Québec)"
}, {
  s: "pont-rouge",
  n: "Pont-Rouge",
  dans: "à Pont-Rouge",
  de: "de Pont-Rouge",
  type: "ville",
  arrT: "MRC",
  arr: "Portneuf",
  zone: "Portneuf",
  d: "Dans Portneuf, au bord de la rivière Jacques-Cartier, juste au nord de Donnacona. Le moulin Marcoux, sur le boulevard Notre-Dame, en est le repère le plus connu.",
  situe: "Portneuf, au nord de Donnacona",
  chiffre: ["Population", "10 121", "habitants au recensement de 2021"],
  rep: ["Moulin Marcoux", "Rivière Jacques-Cartier", "Pont Déry"],
  vie: "Une ville en croissance, entre rivière et campagne, à mi-chemin entre la vie de village et la proximité de Québec.",
  log: "Surtout des maisons unifamiliales et des jumelés, avec des duplex et quelques immeubles à logements près du centre.",
  pres: ["Rivière aux Pommes", "Rue Dupont", "Donnacona"],
  sav: "Pont-Rouge touche à Saint-Augustin-de-Desmaures, ce qui facilite les trajets vers Québec. La voiture reste le moyen le plus pratique pour se déplacer.",
  hist: ["Les premiers efforts de colonisation dans le secteur remonteraient à 1769. Le 15 avril 1867, l’archevêque de Québec Charles-François Baillargeon fonde la paroisse Sainte-Jeanne-de-Neuville. Elle est formée de parties de Cap-Santé, de Saint-Basile et de Neuville.", "Les ponts et le chemin de fer marquent le développement du secteur. Le pont Royal, aujourd’hui le pont Déry, était un pont à péage qui servait au transport des lourdes charges et du courrier entre Québec et Montréal. Un second pont, gratuit, est construit : le pont Rouge. Le chemin de fer du Canadien Pacifique arrive en 1874.", "Vers 1870 à 1872, un moulin à eau est bâti en pierre calcaire au bord de la Jacques-Cartier. Ce moulin, le moulin Marcoux, fonctionne jusqu’à sa faillite en 1910, puis devient une salle de spectacle et de cinéma en 1918. En 1911, la paroisse se divise en deux : le village de Pont-Rouge et la paroisse Sainte-Jeanne-de-Pont-Rouge.", "Dans les années 1970, le moulin Marcoux est menacé de démolition. Il est restauré de 1974 à 1980 et reconnu monument historique en 1978. En 1996, le village et la paroisse se regroupent sous le nom de Ville de Pont-Rouge."],
  portrait: ["Pont-Rouge fait partie de la MRC de Portneuf, dans la région de la Capitale-Nationale. La rivière Jacques-Cartier traverse la ville, et la rivière aux Pommes et la rivière Noire coulent dans sa partie sud. Elle a pour voisines Saint-Raymond au nord-ouest, Donnacona au sud et Saint-Augustin-de-Desmaures à l’est.", "Au recensement de 2021, la ville comptait 10 121 habitants, contre 9 240 en 2016. Son territoire couvre 123,4 km². Ses habitants s’appellent les Pont-Rougeois et les Pont-Rougeoises."],
  dates: [["1867", "Fondation de la paroisse Sainte-Jeanne"], ["1874", "Arrivée du train du Canadien Pacifique"], ["1911", "Séparation du village et de la paroisse"], ["1978", "Moulin Marcoux reconnu monument historique"], ["1996", "Regroupement en Ville de Pont-Rouge"]],
  wiki: "https://fr.wikipedia.org/wiki/Pont-Rouge"
}, {
  s: "saint-raymond",
  n: "Saint-Raymond",
  dans: "à Saint-Raymond",
  de: "de Saint-Raymond",
  type: "ville",
  arrT: "MRC",
  arr: "Portneuf",
  zone: "Portneuf",
  d: "Au centre de la MRC de Portneuf, dans la vallée de la rivière Sainte-Anne, à 25 km au nord de Donnacona. Les routes 354, 365 et 367 traversent son territoire.",
  situe: "Centre de Portneuf, à 25 km au nord de Donnacona",
  chiffre: ["Population", "11 108", "habitants au recensement de 2021"],
  rep: ["Vallée Bras-du-Nord", "Lac Sept-Îles", "Piste cyclable Jacques-Cartier–Portneuf"],
  vie: "Une petite capitale régionale entourée de forêts, de lacs et de rivières, très appréciée pour le plein air.",
  log: "Des maisons unifamiliales au centre et dans les quartiers résidentiels, des résidences au bord des lacs et quelques immeubles à logements près du centre.",
  pres: ["Centre multifonctionnel Rolland-Dion", "Rivière Sainte-Anne", "Réserve faunique des Laurentides"],
  sav: "Le territoire couvre 693,6 km² et plusieurs secteurs sont loin du centre. La voiture est presque indispensable, surtout l’hiver.",
  hist: ["Aux XVIIe et XVIIIe siècles, après leur défaite contre les Iroquois, des Wendats s’installent dans la seigneurie de Bourg-Louis et les cantons voisins. Ils y chassent, y pêchent et y cueillent des petits fruits.", "Des colons venus de L’Ancienne-Lorette s’établissent sur le territoire dès 1830. La paroisse catholique de Saint-Raymond-Nonnat est fondée vers 1842. Son nom honore Raymond Nonnat, un cardinal catalan. La paroisse civile est érigée en 1845.", "En 1898, le village se détache de la municipalité de paroisse. En 1905, le hameau de Chute-Panet se forme autour des installations de la Compagnie de papier Saint-Raymond. En 1958, la paroisse abandonne la particule « Nonnat » de son nom.", "Le 29 mars 1995, le village et la paroisse se réunissent pour former la ville de Saint-Raymond. L’ancienne voie ferrée qui menait vers Rivière-à-Pierre et le lac Saint-Jean est devenue une piste cyclable. Le bois et le cuir restent au cœur de l’économie locale."],
  portrait: ["Saint-Raymond s’étend de part et d’autre de la rivière Sainte-Anne, au cœur de la MRC de Portneuf. Le noyau urbain, au creux de la vallée, compte environ 3 000 habitants. Le reste de la population vit dans des hameaux comme Bourg-Louis et Chute-Panet, des quartiers résidentiels et des secteurs de villégiature autour des lacs.", "Au recensement de 2021, la ville comptait 11 108 habitants sur 693,6 km². Le Centre multifonctionnel Rolland-Dion, avec ses six salles, accueille spectacles et artistes. Chaque juillet, le Festival forestier de Saint-Raymond anime la ville."],
  dates: [["1830", "Arrivée de colons de L’Ancienne-Lorette"], ["1842", "Fondation de la paroisse Saint-Raymond-Nonnat"], ["1898", "Création du village de Saint-Raymond"], ["1905", "Naissance du hameau de Chute-Panet"], ["1995", "Réunion du village et de la paroisse"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Raymond"
}];
const quartierDe = path => QUARTIERS.find(q => '/quartiers/' + q.s === path);
/* Bande pour la page Logements à louer : maillage vers les neuf guides. */
function BandeQuartiers() {
  return <Section fond="douce"><TitreBloc surtitre="Guides de quartier" titre="Choisir son quartier {à Québec}." texte="Repères, artères et logements à louer, quartier par quartier." action={<Fleche to="/quartiers">Tous les guides</Fleche>} />
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px'
    }}>{QUARTIERS.map(q => <a key={q.s} href={"/quartiers/" + q.s} style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: '44px',
        padding: '0 18px',
        borderRadius: '999px',
        border: LIGNE,
        background: '#fff',
        fontSize: '14px',
        fontWeight: 600,
        color: 'var(--marine-900)',
        textDecoration: 'none'
      }}>{q.n}</a>)}</div></Section>;
}

/* Sélecteur de secteurs (page des guides, 12 oct. 2026) : recherche, zones, liste accessible au clavier, carte schématique et aperçu.
   La carte est décorative (aria-hidden) : la liste de liens est la navigation réelle. Positions approximatives, non à l'échelle. */

const ZTAB = [['Tous', 'Tous'], ['Ville de Québec', 'Québec'], ['Rive-Nord', 'Rive-Nord'], ['Rive-Sud', 'Rive-Sud'], ['Portneuf', 'Portneuf']];
const CSS_SEL = `
.sel-p{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1.4fr);gap:20px;padding:20px;border-radius:22px;background:#fff;border:1px solid rgba(12,33,71,.10);box-shadow:0 2px 4px rgba(12,33,71,.05),0 40px 80px -30px rgba(12,33,71,.30)}
.sel-in{width:100%;box-sizing:border-box;height:52px;padding:0 16px 0 46px;border-radius:12px;border:1px solid rgba(12,33,71,.16);background:#F5F8FC;font:400 14px var(--police-corps,Poppins);color:var(--marine-900);transition:border-color .2s,box-shadow .2s,background .2s}
.sel-in::placeholder{color:#6B7A8F}.sel-in:focus{outline:none;background:#fff;border-color:#4581CB;box-shadow:0 0 0 4px rgba(69,129,203,.18)}
.sel-z{display:flex;flex-wrap:wrap;gap:5px}
.sel-zb{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 10px;border-radius:10px;border:1px solid rgba(12,33,71,.14);background:#fff;font:600 12.5px var(--police-corps,Poppins);color:var(--marine-900);cursor:pointer;transition:background .2s,color .2s,border-color .2s}
.sel-zb b{font-size:11px;font-weight:600;color:#4581CB}.sel-zb:hover{border-color:#4581CB}
.sel-zb[aria-pressed="true"]{background:var(--marine-900);border-color:var(--marine-900);color:#fff}.sel-zb[aria-pressed="true"] b{color:#91B5E0}
.sel-zb:focus-visible,.sel-li a:focus-visible{outline:2px solid #4581CB;outline-offset:2px}
.sel-l{list-style:none;margin:0;padding:0 6px 0 0;display:grid;max-height:560px;overflow:auto;scrollbar-width:thin}
.sel-li a{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;min-height:54px;padding:8px 14px;border-radius:10px;text-decoration:none;color:inherit;transition:background .2s}
.sel-li+.sel-li a{box-shadow:inset 0 1px 0 rgba(12,33,71,.07)}
.sel-li a[data-actif="true"]{background:#EEF4FB;box-shadow:none}
.sel-li .sel-fl{color:#91B5E0;transition:transform .25s,color .25s}.sel-li a[data-actif="true"] .sel-fl{color:#4581CB;transform:translateX(3px)}
.sel-dr{display:grid;gap:14px;align-content:start}
.sel-det{display:grid;grid-template-columns:minmax(0,1fr) 210px;gap:18px;padding:20px 22px;border-radius:16px;background:#fff;border:1px solid rgba(12,33,71,.10);box-shadow:0 18px 36px -22px rgba(12,33,71,.30)}
.sel-det-d{display:grid;gap:10px;align-content:space-between}
.sel-ch{display:grid;gap:6px;padding:16px;border-radius:12px;color:#fff;background:radial-gradient(120% 90% at 100% 0%,rgba(69,129,203,.5),rgba(69,129,203,0) 60%),linear-gradient(135deg,#173A6E,#0C2147)}
.sel-go{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:0 16px;border-radius:12px;background:var(--marine-900);color:#fff;font-size:14px;font-weight:600;text-decoration:none;transition:background .2s,transform .2s}.sel-go:hover{background:#173A6E;transform:translateY(-1px)}.sel-go:focus-visible{outline:2px solid #4581CB;outline-offset:3px}
@media (prefers-reduced-motion:no-preference){.sel-det{animation:sel-in .35s cubic-bezier(.2,.7,.2,1)}}
.sel-c{position:relative;aspect-ratio:860/798;min-height:0;border-radius:16px;overflow:hidden;background:linear-gradient(135deg,#EEF4FB,#DCE8F6)}
.sel-c>svg{position:absolute;inset:0;width:100%;height:100%}
.sel-pt{transition:r .3s,fill .3s,opacity .3s;cursor:pointer}
@media (prefers-reduced-motion:no-preference){@keyframes sel-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}.sel-halo{animation:sel-h 2s ease-out infinite;transform-box:fill-box;transform-origin:center}@keyframes sel-h{0%{transform:scale(.6);opacity:.9}100%{transform:scale(2);opacity:0}}}
@media (max-width:960px){.sel-p{grid-template-columns:minmax(0,1fr)}.sel-c{min-height:320px}}
@media (max-width:640px){.sel-dr{display:none}}
@media (max-width:640px){.sel-c{display:none}.sel-l{max-height:none}}`;
/* Carte régionale (12 oct. 2026) : tracés OpenStreetMap (© contributeurs OpenStreetMap, ODbL) projetés et simplifiés une fois,
   intégrés au site (aucune requête externe). Médaillon agrandi pour les neuf quartiers de la ville de Québec. */
const CARTE_QC = {
  "m": {
    "W": 860,
    "H": 798,
    "eau": "M132 662L126 661L128 657L120 657L118 661L114 654L108 655L109 649L105 650L103 646L97 645L92 638L88 640L92 633L89 629L85 634L84 630L87 628L82 626L85 623L79 618L83 614L74 615L74 611L78 610L77 607L71 609L69 612L67 607L62 607L61 604L55 603L50 597L39 600L34 597L30 605L24 602L22 606L18 604L13 609L1 596L-5 600L-10 597L-11 601L-14 598L-17 601L-14 592L-24 592L-25 586L-30 584L-32 579L-34 579L-31 585L-26 586L-23 593L-14 592L-17 602L-14 598L-11 602L-9 597L-5 600L0 596L13 609L17 604L22 606L24 602L31 606L30 602L34 597L38 601L47 601L50 598L55 603L60 604L61 608L66 607L69 613L71 609L78 608L74 611L74 615L82 615L79 618L85 623L81 626L87 628L83 630L85 634L88 633L89 630L91 633L88 640L92 638L96 645L103 646L105 651L109 649L107 656L114 655L119 661L120 658L128 657L126 661L131 662L134 665L126 671L123 669L124 673L122 671L121 674L118 673L114 681L104 680L105 688L107 688L104 691L111 697L108 699L117 705L114 708L116 712L113 713L120 718L122 731L126 735L129 734L128 736L131 736L133 744L136 744L133 749L138 752L139 757L143 757L141 758L143 760L151 756L153 759L175 763L187 750L199 751L187 750L175 763L153 759L151 756L144 760L141 758L144 758L142 756L139 757L138 752L133 749L136 743L133 743L131 735L128 736L129 734L126 735L122 731L120 717L114 713L117 712L114 708L117 705L109 699L111 697L105 691L108 688L105 688L104 679L116 680L118 673L121 675L122 671L124 673L123 669L125 672L131 669L134 665L132 662ZM450 241L461 255L469 256L471 267L476 272L474 284L483 283L483 288L492 294L495 309L497 307L500 311L504 307L504 312L508 308L513 309L517 307L518 311L523 311L527 306L531 305L533 310L540 311L555 301L557 293L567 298L574 294L566 297L555 291L554 301L548 302L540 310L533 310L531 305L527 305L523 311L518 311L517 307L513 309L508 308L504 311L504 307L500 311L498 307L494 309L493 294L485 290L484 283L482 283L474 284L476 280L476 272L472 267L470 256L460 254L459 250L456 250L450 243L451 232L454 232L456 227L453 226L459 222L459 216L463 217L465 215L463 209L457 209L460 201L453 196L455 194L452 193L453 196L460 201L457 210L462 209L465 215L463 213L463 217L457 218L459 221L453 226L455 227L454 232L451 232L450 241ZM1039 162L1046 161L1052 156L1056 156L1060 152L1065 156L1080 146L1082 142L1079 140L1085 134L1090 121L1090 116L1096 111L1094 107L1095 110L1089 115L1089 120L1079 139L1081 142L1078 147L1071 149L1065 155L1060 151L1045 161L1039 160L1039 169L1034 164L1029 169L1030 174L1018 177L1022 182L1021 187L1014 184L1013 188L1002 196L1000 206L994 208L993 211L989 210L988 215L982 215L982 219L978 222L971 221L970 225L973 229L954 245L947 268L933 285L934 292L931 294L942 302L947 312L954 312L947 322L948 328L958 333L960 345L966 351L978 359L984 355L990 354L998 359L1002 368L1017 378L1018 386L1024 391L1031 389L1037 396L1043 399L1043 402L1048 401L1049 404L1061 401L1067 404L1081 396L1089 399L1088 403L1090 397L1112 394L1121 387L1123 381L1125 383L1129 381L1133 373L1147 368L1152 363L1156 360L1152 357L1153 355L1158 356L1164 346L1163 331L1178 320L1163 330L1164 345L1161 352L1151 357L1156 360L1147 368L1133 372L1126 383L1123 381L1121 387L1112 393L1088 398L1079 395L1067 404L1061 401L1050 403L1048 400L1043 402L1043 398L1038 396L1031 389L1024 391L1018 385L1017 377L1009 370L1004 369L998 358L987 354L978 359L966 350L961 345L958 333L950 327L949 321L954 312L947 312L942 301L939 301L941 300L932 294L935 289L932 288L947 271L955 245L974 228L973 232L971 222L978 223L983 220L983 215L987 216L990 210L993 212L995 208L1000 208L1003 201L1002 197L1013 188L1014 184L1018 188L1022 186L1019 176L1030 175L1029 169L1034 164L1039 169L1039 162ZM885 -52L880 -47L874 -48L867 -41L863 -42L858 -39L852 -12L845 -7L847 -2L839 7L838 14L831 13L826 21L831 27L831 33L834 35L831 41L834 40L835 35L831 33L832 27L827 22L828 18L833 12L838 14L839 7L847 -2L846 -8L853 -12L859 -31L859 -39L863 -42L867 -41L873 -47L880 -46L883 -51L890 -52L896 -61L904 -62L896 -62L899 -88L905 -98L886 -134L892 -142L888 -151L896 -156L895 -165L889 -169L893 -172L896 -188L909 -200L909 -205L914 -206L915 -213L929 -230L936 -235L936 -242L943 -247L948 -255L955 -258L953 -263L957 -271L947 -280L933 -283L930 -290L929 -306L921 -318L923 -325L916 -346L911 -368L909 -396L901 -417L898 -442L887 -467L881 -471L882 -476L880 -473L886 -466L898 -442L901 -417L908 -396L910 -367L923 -324L921 -318L928 -307L929 -289L933 -283L947 -279L957 -269L953 -264L954 -258L948 -256L943 -247L935 -243L936 -235L929 -230L916 -214L914 -207L909 -205L909 -201L896 -188L889 -169L895 -165L896 -156L888 -151L892 -143L886 -134L904 -97L899 -88L894 -61L885 -52ZM75 91L79 88L77 84L85 78L81 77L83 73L80 71L80 65L78 65L75 70L77 63L69 64L71 58L74 57L70 53L77 49L71 46L66 36L56 33L57 25L46 15L42 7L45 2L45 -8L48 -11L46 -11L45 2L42 7L44 13L57 25L56 33L65 37L70 46L77 49L69 52L74 58L70 57L68 64L72 65L77 63L75 70L80 65L81 78L84 78L76 83L79 87L75 91ZM524 432L526 434L523 438L526 441L529 443L545 438L560 455L562 465L544 479L540 485L544 492L555 499L557 505L553 513L555 519L560 519L548 540L553 548L566 553L573 559L575 578L586 599L599 607L618 609L622 614L624 622L636 627L642 634L652 631L662 655L675 664L680 662L681 656L685 657L688 677L697 701L712 725L727 737L729 744L743 761L762 767L772 777L781 792L792 798L802 810L800 829L802 847L815 863L829 873L841 905L845 907L862 907L871 921L879 925L878 945L891 954L892 967L897 975L905 983L916 987L921 1003L934 1009L947 1002L954 1004L958 1010L964 1024L962 1037L967 1053L966 1065L967 1059L971 1077L977 1086L983 1086L989 1093L1001 1099L1007 1107L1007 1117L1015 1124L1010 1159L1018 1126L1007 1116L1008 1109L1003 1100L990 1090L983 1085L976 1084L971 1075L968 1060L971 1050L965 1035L967 1027L959 1008L947 1001L936 1007L920 1001L916 986L898 976L892 967L892 954L879 945L878 941L880 936L882 937L880 925L871 919L862 906L842 904L828 871L816 862L811 854L803 846L803 809L793 797L782 791L764 767L743 760L730 744L728 736L712 724L698 701L699 690L689 678L687 657L682 655L675 663L664 655L657 634L653 630L646 631L639 628L626 620L624 613L614 605L602 605L588 598L579 578L580 568L575 559L568 552L554 547L549 540L559 528L562 520L556 517L561 508L554 494L547 492L546 480L556 475L564 465L562 452L547 437L541 436L530 441L525 439L527 433L524 431L525 418L519 414L519 401L522 393L531 389L529 386L526 386L528 389L522 392L518 399L517 412L521 416L520 423L524 432ZM690 284L669 288L653 283L632 288L623 287L621 282L614 284L615 281L614 285L598 298L591 330L587 331L590 332L590 335L583 342L580 341L583 344L582 348L571 357L557 363L552 369L547 371L546 375L526 386L518 384L494 394L484 399L477 410L446 421L433 428L395 430L387 435L360 441L353 448L349 446L336 457L310 470L296 472L287 471L274 477L259 491L260 493L257 492L249 500L226 509L200 514L164 516L156 514L156 510L152 514L142 515L110 503L81 467L77 471L65 473L45 492L36 511L27 520L-8 534L-23 558L-37 572L-34 578L-42 578L-42 582L-51 590L-68 596L-77 592L-93 592L-102 597L-122 592L-138 598L-141 603L-168 618L-186 644L-200 653L-201 666L-206 676L-214 716L-223 731L-223 741L-234 756L-236 754L-238 757L-244 757L-267 770L-280 771L-281 767L-286 769L-290 776L-298 780L-305 775L-306 779L-308 777L-310 780L-310 777L-313 782L-313 780L-316 779L-321 779L-323 782L-327 783L-326 781L-332 783L-329 780L-329 776L-336 775L-335 770L-338 773L-338 785L-344 785L-356 796L-378 802L-380 807L-382 806L-380 801L-390 803L-391 809L-408 820L-434 847L-442 851L-445 848L-447 855L-454 859L-460 871L-480 893L-499 908L-524 921L-533 937L-541 940L-539 935L-548 943L-547 947L-560 916L-556 912L-545 911L-539 904L-526 899L-505 895L-493 888L-468 858L-465 852L-467 852L-454 835L-435 826L-435 822L-427 814L-421 800L-412 792L-364 765L-339 758L-323 739L-310 730L-269 725L-260 720L-257 722L-248 718L-243 708L-235 666L-226 651L-228 642L-217 629L-210 610L-198 607L-196 601L-181 595L-184 595L-174 586L-181 587L-173 585L-178 584L-170 583L-152 572L-141 569L-139 571L-139 569L-134 571L-131 568L-128 571L-130 568L-123 569L-122 565L-119 566L-118 562L-115 564L-113 561L-117 565L-108 565L-107 561L-108 565L-103 566L-103 563L-101 566L-101 560L-100 566L-99 561L-98 567L-96 565L-94 575L-94 568L-89 571L-92 566L-87 568L-87 564L-80 566L-82 564L-79 562L-77 564L-70 564L-44 532L-30 520L-24 518L-4 502L2 502L8 496L17 495L40 454L52 447L57 455L52 447L53 445L68 446L83 442L98 449L125 468L140 471L149 470L158 465L160 469L188 467L201 471L213 462L222 462L232 451L239 453L240 448L249 441L259 440L266 436L282 439L293 437L305 426L308 427L323 417L342 415L359 407L385 401L404 400L410 395L424 393L435 396L446 394L453 396L465 389L475 379L480 380L496 376L514 379L530 371L539 359L554 351L554 344L560 339L558 336L560 339L561 333L566 332L566 328L577 321L583 312L587 298L584 296L588 295L588 297L590 290L587 294L574 294L579 288L592 283L590 275L581 276L585 269L582 268L584 264L587 261L601 259L610 253L616 246L617 247L618 241L622 241L622 235L634 219L690 179L696 172L696 169L697 171L702 167L706 153L739 118L737 115L740 117L757 104L775 85L774 82L798 68L801 70L800 67L804 64L830 51L832 48L831 43L835 45L874 35L894 34L913 10L929 -4L942 -7L981 50L992 80L1041 105L1045 110L1033 114L1018 129L968 165L957 164L957 160L949 165L950 170L946 170L946 168L935 176L934 187L923 198L909 198L904 186L892 195L885 205L876 210L867 223L853 223L853 215L848 218L844 212L839 217L831 218L816 230L814 229L813 233L798 236L785 248L783 255L777 257L753 280L736 284L718 280L711 282L703 280L702 277L702 281L690 284ZM967 63L945 75L930 90L962 70L968 65L967 63ZM901 63L895 63L880 70L865 63L795 92L770 118L741 155L728 167L703 180L685 201L672 208L668 215L667 212L665 214L667 216L649 232L640 251L633 259L633 264L641 268L648 262L667 264L697 262L711 254L720 256L737 251L740 253L739 251L757 237L768 221L777 214L776 209L787 209L797 202L795 200L799 201L808 197L829 183L837 174L844 158L865 130L864 126L875 119L888 97L893 95L896 77L902 68L901 63ZM896 135L915 122L915 116L911 115L896 135ZM73 221L67 227L67 236L61 244L63 248L58 250L59 258L55 258L54 261L60 270L61 276L58 276L53 270L49 273L35 271L23 276L9 273L1 280L-6 275L-7 284L-24 301L-30 300L-42 310L-44 318L-39 327L-43 331L-51 328L-54 330L-53 334L-61 339L-60 349L-57 353L-65 353L-66 356L-63 361L-50 358L-49 362L-60 368L-63 368L-64 363L-73 366L-74 374L-81 382L-80 388L-91 399L-89 410L-93 411L-92 409L-95 411L-99 421L-109 430L-114 429L-116 449L-112 458L-122 460L-122 469L-134 473L-147 483L-149 488L-149 485L-152 486L-149 486L-149 494L-155 502L-160 501L-165 506L-200 519L-199 528L-202 540L-215 560L-215 567L-211 570L-202 576L-203 597L-197 603L-202 596L-201 574L-215 564L-207 550L-200 545L-198 528L-200 520L-175 512L-160 502L-155 503L-148 495L-147 484L-121 470L-121 461L-111 458L-116 442L-113 430L-98 422L-95 413L-87 410L-90 401L-79 390L-80 384L-73 374L-72 367L-66 363L-60 369L-48 362L-50 357L-62 361L-66 355L-56 353L-60 343L-60 340L-52 334L-54 330L-51 329L-49 332L-43 332L-38 327L-39 319L-40 322L-42 320L-42 311L-30 301L-22 301L-6 284L-6 276L1 281L8 275L15 277L36 272L50 274L52 271L57 277L61 277L62 271L54 262L60 259L63 243L69 233L67 228L75 227L75 223L75 226L72 224L73 221ZM603 198L604 202L610 201L616 212L624 211L631 223L627 213L623 210L616 211L608 200L611 184L616 176L613 173L607 175L602 182L596 179L599 183L608 178L608 175L615 175L610 184L611 191L608 195L603 197L603 195L603 198ZM591 162L591 177L596 180L591 174L594 157L580 123L591 114L590 102L591 96L601 91L590 96L588 108L590 114L580 123L581 136L587 141L593 154L591 162ZM675 -51L667 -44L666 -34L657 -23L652 -24L646 -17L635 -11L633 -5L618 6L616 12L625 34L617 49L617 57L605 61L602 81L603 88L600 91L603 90L602 74L606 63L617 58L618 49L625 35L617 11L618 6L652 -23L658 -23L666 -34L668 -44L675 -51ZM667 -111L655 -119L635 -125L634 -130L619 -141L617 -153L619 -142L623 -135L634 -129L638 -123L655 -118L671 -106L682 -94L686 -85L691 -84L692 -79L675 -51L693 -78L692 -84L686 -86L681 -97L667 -111ZM172 91L167 93L164 97L154 98L145 111L136 116L136 122L133 123L123 146L112 159L113 163L115 154L124 146L137 123L137 118L146 111L150 103L155 98L164 97L167 93L180 90L185 75L189 75L205 57L204 50L210 37L216 36L225 24L236 23L229 21L222 24L216 19L221 13L220 6L228 2L231 -9L240 -23L230 -9L228 2L220 6L220 12L216 20L222 24L219 30L215 31L216 36L210 36L207 40L201 53L203 58L188 74L185 74L180 90L172 91ZM689 446L683 457L670 468L685 476L686 482L690 481L687 488L694 500L709 508L714 507L716 510L764 517L767 523L786 526L790 534L786 537L787 540L794 543L796 547L805 553L816 553L820 556L857 552L875 558L882 570L876 587L877 594L886 604L883 601L894 605L894 612L909 618L911 626L909 633L917 644L949 656L961 669L967 671L976 667L982 661L989 662L996 655L1003 655L1019 670L1021 677L1025 673L1032 677L1031 682L1036 682L1035 685L1041 687L1041 691L1044 690L1042 693L1048 701L1045 701L1043 706L1045 710L1040 714L1042 721L1041 729L1037 731L1039 743L1034 747L1020 774L1020 783L1025 785L1024 790L1027 790L1027 787L1030 790L1031 785L1033 790L1045 787L1043 785L1047 783L1044 783L1047 780L1049 783L1058 777L1074 763L1081 752L1089 749L1102 725L1104 728L1110 728L1115 707L1131 702L1134 691L1144 691L1154 680L1156 682L1157 679L1164 681L1173 675L1176 665L1183 663L1182 667L1183 663L1176 665L1173 675L1164 681L1157 679L1156 682L1154 680L1144 690L1134 692L1130 699L1131 702L1115 707L1110 727L1104 728L1101 725L1092 744L1082 752L1074 764L1058 776L1049 782L1047 779L1044 783L1047 783L1043 785L1045 787L1035 790L1031 785L1030 790L1026 787L1027 790L1024 790L1026 785L1020 782L1020 774L1033 748L1039 743L1038 731L1041 729L1042 721L1040 714L1045 710L1043 706L1046 701L1048 701L1042 693L1044 690L1041 691L1041 687L1035 685L1036 682L1031 682L1032 677L1025 673L1021 676L1019 670L1017 670L1003 654L996 655L990 661L981 661L976 666L968 670L961 669L949 656L917 644L910 634L912 625L910 618L894 612L894 605L882 600L877 593L883 570L875 557L857 551L820 555L816 552L805 552L787 538L790 534L787 526L771 523L763 516L737 514L733 510L702 505L688 491L691 481L686 481L685 476L671 467L683 458L690 446L688 440L678 440L674 436L676 432L669 430L656 419L650 418L650 414L640 406L635 395L624 385L620 387L617 384L609 387L602 382L594 383L579 387L574 375L577 374L578 367L574 364L562 364L573 364L578 367L573 375L579 387L593 383L609 388L617 384L620 387L623 385L626 390L635 397L639 407L645 411L646 419L648 419L645 418L646 413L649 419L657 420L669 431L675 433L673 436L677 441L686 440L690 444L689 446ZM331 234L331 243L323 243L311 250L305 250L299 257L285 263L271 261L268 264L257 265L252 262L255 264L254 267L289 263L293 259L301 258L306 251L312 252L322 244L332 243L335 224L331 220L331 214L335 214L343 206L347 197L348 183L343 179L348 162L352 155L358 155L359 149L370 153L374 151L374 147L369 144L369 139L364 133L367 119L365 115L359 113L356 100L362 99L364 92L365 80L361 80L358 74L361 71L363 58L369 49L371 39L375 35L383 35L385 31L403 32L409 28L410 5L422 -6L434 -6L441 -10L451 -33L457 -37L462 -46L459 -56L460 -68L467 -73L467 -81L461 -97L453 -106L453 -110L437 -136L414 -194L417 -179L433 -140L461 -94L466 -79L467 -73L460 -68L461 -60L458 -57L461 -47L456 -38L450 -34L441 -11L434 -6L421 -7L410 3L408 12L410 16L408 23L407 20L407 29L396 32L386 30L382 34L373 35L367 42L367 50L362 58L360 71L357 73L360 79L365 82L362 95L356 99L356 107L359 115L365 117L363 133L368 146L373 147L369 151L359 148L357 155L352 154L347 163L342 179L347 183L346 197L334 213L330 211L328 214L334 224L331 234ZM187 378L194 386L197 383L201 384L200 394L203 401L201 404L195 402L195 405L188 407L186 419L169 431L166 438L157 440L163 447L164 457L160 460L156 456L158 464L154 456L162 457L162 449L157 439L165 438L169 429L186 418L188 406L194 405L195 402L200 403L202 401L199 395L201 384L198 383L194 386L187 378ZM197 373L195 367L199 364L195 356L198 351L207 347L212 339L217 331L216 321L226 313L235 311L240 305L217 317L213 323L215 333L207 346L196 350L193 358L198 364L195 366L196 372L187 378L197 373ZM463 519L464 512L476 507L485 506L486 504L482 503L492 503L494 499L487 500L498 496L499 493L506 493L509 489L513 490L512 486L516 485L519 478L538 470L540 462L534 454L535 447L530 442L534 447L533 454L539 462L538 469L520 477L512 485L513 490L508 489L506 492L500 492L498 495L487 499L494 499L492 502L483 502L482 504L485 504L485 506L477 506L463 512L462 520L458 523L461 528L455 536L457 549L466 551L459 560L465 569L458 572L457 576L463 588L466 590L462 598L462 605L456 611L456 624L459 625L459 631L462 634L454 641L460 650L470 652L472 653L471 655L475 656L477 662L471 665L477 670L474 679L479 681L480 686L488 690L486 703L489 707L483 709L483 721L488 724L485 726L488 731L493 732L500 744L511 748L512 752L519 750L524 751L523 754L545 763L563 761L566 763L563 761L545 763L524 754L524 751L521 749L512 752L511 747L500 744L493 732L488 731L486 727L489 725L484 722L483 714L484 709L490 706L486 703L488 690L474 679L477 669L471 664L475 664L477 660L470 651L460 650L454 641L462 634L459 631L459 625L456 624L456 611L462 606L462 598L466 590L463 588L459 581L460 577L457 576L459 572L466 569L459 560L466 551L458 549L455 541L455 535L461 529L458 523L463 519ZM254 291L257 285L249 276L254 265L248 274L256 286L253 290L237 305L243 303L254 291ZM74 220L79 208L71 202L73 199L70 196L73 190L72 176L75 180L82 175L81 163L80 168L80 176L75 179L72 176L69 195L72 199L71 202L79 208L72 218L74 220Z",
    "riv": [{
      "n": "Rivière Montmorency",
      "d": "M661 -540L656 -530L653 -514L647 -504L644 -492L640 -491L641 -487L635 -480L631 -480L628 -469L596 -418L597 -412L590 -411L589 -406L581 -400L592 -384L602 -356L620 -327L625 -313L632 -310L637 -300L634 -276L639 -267L636 -249L640 -233L636 -220L636 -198L617 -152L619 -142L634 -129L636 -124L656 -118L671 -109L686 -85L691 -84L692 -80L684 -63L669 -47L666 -34L657 -23L651 -24L618 6L617 12L624 36L617 49L617 57L606 63L602 74L602 90L590 97L590 114L580 123L584 138L592 150L592 178L601 183L607 178L607 175L615 175L611 184L608 200L615 211L623 210L627 213L631 222M586 140L585 139M585 139L581 134L582 130M588 142L592 153"
    }, {
      "n": "Rivière du Berger",
      "d": "M503 205L504 206M507 292L508 293M505 291L507 292M505 291L505 291M504 207L506 208M508 214L508 214M507 208L507 209M503 202L503 203M506 208L506 208M507 215L507 216M508 212L508 212M507 209L508 212M506 208L507 208M503 204L503 205M508 212L508 213M504 206L504 207M511 220L515 238L498 241L491 248L488 258L495 269L493 271L498 285L505 291M508 214L507 215M503 203L503 204M506 200L503 202M509 294L509 294M508 293L508 293M508 293L508 293M508 293L509 294M513 298L510 299L512 302M506 198L506 200M506 200L506 200M506 198L506 198M506 196L506 198M506 196L506 196M506 190L506 196M507 216L511 220M511 220L511 220M513 302L515 305L509 308M512 302L513 302M508 213L508 214M508 213L508 213M509 294L513 298M513 298L513 298"
    }, {
      "n": "Rivière Jacques-Cartier",
      "d": "M370 39L369 46M362 95L359 99M366 137L368 143M293 259L299 257M188 376L188 378M274 263L270 261L268 265M409 20L408 28L404 31L385 31L382 34L372 36L367 41L369 49L365 55M334 213L329 214L334 224L331 243L323 243L311 251L305 251L298 259L253 267L249 276L256 285L256 290L252 291L251 295L235 310L227 312L215 321M215 321L216 331L206 347L197 351L195 358L198 364L195 367M195 367L196 373L188 376M188 378L195 386L197 383L201 384L199 388M185 420L169 430L165 438L157 440L162 447L162 458L160 458M422 -6L410 5L409 20M449 -30L445 -22M445 -22L444 -17M365 55L361 71L357 74L360 79L365 82L362 97L357 99L356 103L359 114L366 118L363 134L369 146L374 149L370 153L359 148L357 155L351 156L342 179L347 183L347 196L343 206L334 213M188 415L185 420M202 398L201 403L195 402L194 405L187 407L188 415M199 388L202 398M159 465L158 491M444 -17L438 -8L431 -7M423 -5L422 -6M409 21L409 25M431 -7L423 -5M423 -5L422 -6M422 -6L422 -6M160 458L155 457L159 465M160 458L160 458"
    }, {
      "n": "Rivière Chassé",
      "d": "M738 674L737 678L739 680M739 688L738 692L733 697M733 697L730 699M743 664L738 666M739 680L739 688M738 666L736 667L738 674M795 673L793 675M745 662L743 664M785 674L772 662M793 675L785 674M796 673L795 673M810 677L796 673M772 662L770 657M751 659L746 660M763 659L751 659M746 660L745 662M730 699L725 703M725 703L710 721"
    }, {
      "n": "Rivière Beaurivage",
      "d": "M651 830L650 821L652 816L650 810L657 798L654 791L641 784L632 786L620 780L614 781L615 778L603 766L599 754L592 755L589 753L582 761L573 764L563 761L545 763L523 754L524 751L519 749L512 752L511 748L499 744L493 732L486 728L488 724L484 721L484 709L490 706L486 703L488 690L480 686L479 681L474 679L477 670L472 667L471 664L476 663L475 656L471 655L470 651L460 650L454 641L462 634L459 631L459 625L456 624L456 610L463 602L462 598L466 589L463 587L457 576L459 572L465 569L459 560L466 550L458 549L456 546L455 535L461 528L458 523L462 520L464 512L478 506L485 506L486 504L482 503L493 503L494 499L487 499L498 495L500 492L506 492L508 489L513 490L512 486L520 477L538 470L540 462L534 454L535 448L531 441"
    }, {
      "n": "Rivière Nelson",
      "d": "M382 191L377 211L379 215L378 226L382 232L407 240L408 243L411 241L422 245L423 248L433 246M433 245L444 240L450 241M433 246L433 245M403 124L403 124M384 150L391 164L396 167L399 178L395 183M395 183L394 183M394 183L390 183M390 183L390 183M390 183L384 184L382 191M382 191L382 191M384 150L384 150M384 149L384 150"
    }, {
      "n": "Rivière Etchemin",
      "d": "M1224 599L1226 610L1223 619L1209 634L1196 659L1185 667L1183 667L1183 663L1176 665L1173 675L1164 681L1158 679L1155 682L1154 680L1144 691L1134 691L1130 699L1131 702L1114 707L1110 728L1104 728L1101 725L1092 744L1088 746L1089 749L1081 752L1074 764L1049 783L1047 779L1044 783L1047 783L1043 785L1045 787L1033 790L1031 785L1030 790L1027 787L1027 790L1024 790L1025 785L1020 782L1020 774L1033 748L1039 743L1037 732L1041 729L1042 722L1040 714L1045 710L1043 706L1045 701L1048 701L1042 693L1044 690L1041 691L1040 687L1035 685L1036 682L1031 682L1032 677L1025 673L1021 676L1019 670L1003 655L996 655L988 661L982 661L972 670L967 671L961 669L949 656L917 644L910 634L911 624L909 618L894 612L894 605L883 601L877 593L876 587L883 570L875 558L858 551L820 556L817 552L805 553L787 538L790 534L786 526L771 523L763 516L737 514L702 505L688 491L690 481L685 480L685 476L671 467L683 457L690 445L688 441L678 441L674 436L675 433L669 430L656 419L649 418L644 410L639 406L635 397L623 385L620 387L617 384L610 388L603 384L588 384M588 384L580 387L577 384M577 384L577 380L573 375L577 373L578 367L573 364L563 365L562 362"
    }, {
      "n": "Rivière Sainte-Anne",
      "d": "M99 195L104 200L102 203M118 152L112 154L112 160M189 74L184 80M62 246L60 259L54 261L61 271L61 276L58 277L52 271L50 273L35 271L23 276L19 274L13 277L8 274L0 280L-6 275L-6 283L-13 291L-24 302L-30 301L-42 310L-44 318L-38 327L-43 332L-50 331L-50 329L-54 330L-53 334L-60 340L-60 348L-57 353L-66 355L-63 361L-51 357L-49 362L-60 369L-65 363L-72 366L-74 374L-80 382L-80 389L-90 400L-88 410L-95 412L-98 421L-109 430L-113 430L-116 449L-112 458L-121 460L-122 470L-134 474L-147 483L-149 495L-155 502L-161 502L-166 507L-200 520L-198 529L-201 541L-216 565L-201 575L-203 595L-197 602M979 -735L983 -728L981 -714L985 -711L957 -700L956 -694L941 -682L919 -683L916 -673L919 -666L916 -661L919 -657L919 -648L915 -644L919 -633L926 -630L922 -623L927 -579L913 -565L910 -550L902 -535L902 -524L898 -511L902 -505L900 -501L880 -473L882 -469L887 -466L898 -442L901 -417L908 -396L911 -367L923 -326L921 -318L928 -308L930 -289L933 -283L947 -279L957 -269L953 -263L954 -258L948 -256L943 -247L936 -243L936 -236L929 -230L916 -214L914 -207L909 -205L910 -201L896 -188L893 -172L889 -169L895 -165L896 -156L888 -151L892 -142L886 -134L892 -118L903 -103L904 -96L899 -88L894 -59L880 -47L875 -48L867 -41L863 -42L859 -39L853 -12L846 -8L847 -2L839 7L838 14L832 12L828 16L827 21L831 27L831 33L834 35L831 41L835 52M103 178L99 190M240 -183L245 -185L246 -180L251 -180L254 -176L258 -178L262 -173L260 -159L264 -153L265 -139L254 -105L250 -62L242 -52L245 -45L242 -40L244 -35L239 -30L240 -24L231 -9L228 1L220 6L220 12L216 20L222 24L216 36L208 39L203 58L189 75L185 75L180 91L167 93L165 97L154 98L146 111L137 117L124 146L115 155L112 166L97 192L102 204L90 213M90 213L88 218L79 216L75 218L67 228L67 236L62 246"
    }, {
      "n": "Rivière Saint-Charles",
      "d": "M454 229L454 232L451 232L450 243L456 250L459 250L461 254L469 256L471 266L476 272L476 280L474 284L483 283L485 288L483 288L492 293L495 309L497 307L500 311L501 307L504 307L504 311L508 308L513 309L517 307L518 311L523 311L527 305L531 305L533 310L540 310L549 302L554 301L557 292L567 298L574 295M452 193L460 201L457 210L462 209L465 214L457 218L459 221L453 225L456 226L454 229M574 295L601 284"
    }, {
      "n": "Rivière Chaudière",
      "d": "M558 527L561 520L555 517L557 512L556 499L545 486L545 479L562 466L561 453L545 438L541 437L529 442L524 440L527 434L523 429L524 420L519 413L518 402L521 393L529 389L526 385M880 928L861 906L842 905L829 872L816 863L803 848L801 829L803 809L791 797L782 791L765 769L757 764L743 760L741 755L729 743L727 736L711 724L697 701L688 677L685 656L681 655L679 662L676 664L663 655L652 630L641 632L625 621L618 608L601 606L587 599L578 578L579 568L573 558L554 547L548 540L558 527"
    }],
    "aut": "M573 304L573 297M523 405L523 399M548 398L564 390M477 168L476 183M478 191L477 171M609 253L592 261M656 200L647 206M619 241L623 233M477 171L469 154M500 219L496 211M423 251L411 241M391 232L379 228M434 269L446 286M518 326L526 325M573 297L573 304M584 240L579 245M522 258L527 265M522 258L512 240M496 212L499 219M699 163L710 144M516 377L520 386M246 614L274 602L299 575M548 473L539 451M541 458L545 468M666 642L676 650M501 224L510 238M388 362L405 369M162 449L155 449M522 408L526 423M468 154L477 168M468 153L458 119M810 59L816 55M752 102L737 116M795 68L783 75M389 502L344 527M390 502L425 484M95 779L131 739M131 738L101 767M161 709L171 698M718 694L707 661L691 652M726 711L741 729M747 734L795 763M795 763L815 781M424 484L390 502M544 400L520 408M684 650L690 652M676 649L666 642M532 437L526 420M690 652L684 649M690 652L706 661L717 694M596 375L578 384M741 299L756 300L794 276M299 575L273 602L246 614M344 526L390 502M155 450L161 450M174 449L168 449M180 449L205 440M205 440L192 447L176 448M209 438L220 430M221 430L233 423M220 429L209 437M341 378L364 371M268 411L245 418M737 116L732 121M737 116L752 101M1071 130L1036 140L933 224L905 239M905 239L946 218L961 200L1036 141L1071 131M887 239L881 239M857 239L866 239M410 241L398 235M428 370L417 374M487 193L495 197L495 211M584 263L582 269M499 296L511 291M247 418L275 409M596 259L612 251M526 423L529 430M518 387L514 377M513 377L518 387M656 200L669 191M458 111L459 131L468 154M458 117L458 111M486 45L468 22L471 -17M458 110L467 87M362 372L341 378M375 366L387 362M467 87L458 110M486 46L485 58L472 71L467 86M468 82L485 59L486 45M471 343L477 340M536 277L543 289M437 366L445 361M509 327L516 326M517 288L499 296M457 293L436 273M452 291L462 296M471 -17L468 21L486 45M574 286L581 275M510 238L501 223M515 245L522 258M635 217L631 221M818 784L796 763M160 709L132 738M132 738L160 710M171 698L160 709M758 740L748 733M723 705L718 694M740 727L726 710M318 555L340 531M340 530L318 554M318 555L299 574M299 575L318 555M741 299L723 297L693 305L680 303M866 239L857 239M869 239L880 239M881 239L887 239M880 239L869 239M641 213L647 207M682 183L669 191M670 191L682 182M683 182L698 163M698 164L682 182M523 407L530 404M575 385L570 387M530 404L545 399M717 694L723 706M795 762L758 740M432 265L425 255M456 354L462 350M574 286L572 296M779 78L774 82M732 121L737 116M903 239L894 239M512 416L507 436L479 456M469 461L504 439M538 449L534 441M534 441L537 449M605 579L593 556M592 556L605 579M585 549L591 554M591 554L586 548M579 542L574 517L555 487M559 495L572 516L579 542M665 640L639 613M639 613L664 640M638 611L630 604M630 604L637 611M608 582L629 603M629 602L609 582M624 232L613 248M494 197L485 193M496 211L495 203M171 698L183 687M183 687L173 696M184 687L198 676M198 676L183 687M198 676L214 661M214 661L198 676M216 659L236 638L242 624M246 614L233 641M600 368L606 356M607 355L612 344M692 305L707 301M638 321L657 310M726 129L718 136M481 310L476 304M619 339L630 329M585 382L596 375M596 375L600 369M606 356L600 367M600 368L596 375M101 767L94 778M429 482L461 465M435 479L427 483M830 243L795 275M795 275L830 244M830 244L849 239M849 239L830 243M707 301L741 299M793 276L757 299L741 299M753 101L772 84M772 84L752 101M647 207L656 200M669 191L656 200M647 206L640 213M718 137L726 129M718 136L710 144M710 144L698 163M710 144L718 137M838 27L853 6M855 3L885 -19M503 330L509 327M308 388L276 407M282 405L308 389M551 480L555 487M569 388L576 385M564 390L550 396M555 487L558 493M233 641L215 659M477 457L435 479M436 272L432 265M480 264L485 270M424 254L432 267M554 485L551 480M446 286L452 291M530 431L532 437M613 249L623 233M545 468L549 475M538 452L541 458M626 331L606 355M614 343L618 339M445 361L436 366M525 419L524 412M404 368L389 362M476 184L480 192M664 306L692 305M657 310L664 306M643 316L627 330M651 312L643 316M461 465L469 461M511 240L515 245M665 305L651 312M680 303L665 305M419 374L429 370M505 438L510 426M232 422L221 429M234 423L240 420M-23 488L3 477M5 475L-23 487M11 468L7 474M9 473L26 445M26 445L39 437M39 436L26 444M26 444L12 466M67 431L51 434M118 448L83 429L67 431M155 449L127 449M134 451L155 450M126 450L133 451M67 432L82 430L125 450M51 435L67 432M314 386L322 383M324 382L308 388M325 383L331 381M332 381L340 379M340 378L332 380M382 362L365 370M411 371L406 369M411 372L417 374M464 297L472 300"
  },
  "i": {
    "W": 420,
    "H": 452,
    "eau": "M-76 86L-75 92L-67 95L-65 102L-68 102L-61 106L-59 112L-56 114L-50 110L-45 124L-36 125L-34 130L-22 129L-18 136L-19 146L-16 158L-8 163L-4 173L-7 180L-2 195L-7 198L-5 202L-9 207L17 204L22 218L17 216L17 219L24 226L44 234L45 255L51 259L48 275L50 278L54 278L53 273L58 273L66 284L69 282L69 273L73 274L77 271L78 274L72 280L76 285L79 279L86 279L87 275L103 279L114 272L117 276L117 283L131 284L138 280L142 268L152 266L158 281L178 282L192 273L201 262L220 255L226 232L234 233L253 247L274 241L273 236L253 244L232 229L226 229L224 225L220 225L224 227L224 230L219 254L212 258L201 258L192 272L179 281L158 280L155 268L152 265L141 267L138 277L131 284L117 282L118 275L114 272L103 278L88 274L85 279L79 278L76 284L73 280L79 275L77 271L68 273L69 282L65 284L59 272L53 273L53 278L49 276L52 259L46 255L45 234L23 224L17 218L23 218L19 204L13 205L-9 206L-5 202L-6 199L-1 196L-5 183L-3 173L-7 163L-15 157L-21 128L-33 129L-36 125L-47 122L-50 110L-58 112L-66 94L-75 91L-73 82L-75 75L-69 67L-73 60L-65 59L-68 54L-65 55L-60 44L-61 41L-63 43L-67 41L-54 34L-58 36L-55 33L-56 30L-50 30L-53 27L-50 25L-53 23L-48 19L-50 15L-46 14L-45 17L-43 15L-40 18L-33 10L-36 2L-42 2L-40 1L-41 -5L-49 -6L-52 -3L-57 -5L-53 -8L-54 -17L-50 -18L-54 -26L-50 -25L-48 -29L-53 -28L-57 -33L-56 -36L-68 -43L-61 -49L-67 -48L-70 -51L-66 -47L-68 -43L-56 -36L-57 -32L-53 -28L-49 -29L-50 -25L-54 -26L-51 -18L-54 -18L-54 -8L-57 -8L-57 -4L-41 -5L-43 2L-36 2L-34 10L-37 11L-39 6L-39 10L-35 12L-38 16L-41 17L-47 13L-50 15L-48 18L-51 16L-53 21L-57 20L-51 25L-53 27L-51 29L-56 28L-56 34L-69 43L-62 42L-61 44L-66 54L-68 53L-66 59L-73 59L-72 65L-69 67L-75 74L-76 70L-75 73L-74 69L-77 71L-74 81L-78 85L-76 86ZM1154 -744L1145 -739L1141 -730L1131 -729L1124 -734L1116 -729L1104 -714L1091 -718L1079 -708L1074 -696L1079 -686L1067 -655L1062 -631L1051 -630L1040 -617L1045 -613L1047 -604L1033 -584L1023 -578L1020 -559L1014 -558L1008 -564L1001 -561L993 -553L987 -539L1002 -521L1000 -503L1010 -498L1002 -489L1000 -483L1002 -479L1009 -484L1012 -499L1002 -504L1001 -513L1003 -521L991 -535L992 -546L997 -557L1006 -562L1015 -556L1022 -558L1023 -576L1034 -583L1048 -603L1043 -620L1051 -628L1063 -630L1067 -654L1080 -684L1075 -696L1079 -707L1091 -717L1104 -713L1120 -730L1125 -732L1132 -728L1139 -729L1149 -741L1161 -746L1164 -743L1168 -745L1171 -754L1184 -770L1198 -769L1207 -772L1191 -769L1184 -773L1185 -792L1192 -808L1191 -824L1196 -837L1194 -847L1199 -858L1209 -869L1210 -876L1204 -891L1194 -904L1191 -915L1175 -933L1168 -962L1157 -978L1163 -989L1172 -994L1174 -1000L1163 -1019L1162 -1026L1173 -1033L1183 -1035L1185 -1038L1182 -1064L1165 -1077L1176 -1085L1174 -1092L1178 -1108L1184 -1119L1186 -1129L1214 -1160L1222 -1164L1225 -1170L1223 -1178L1235 -1182L1239 -1200L1270 -1234L1277 -1249L1299 -1264L1301 -1271L1296 -1279L1297 -1284L1319 -1297L1332 -1321L1351 -1329L1347 -1343L1357 -1358L1357 -1366L1330 -1390L1315 -1391L1307 -1398L1291 -1400L1280 -1418L1278 -1465L1256 -1499L1262 -1511L1261 -1518L1258 -1528L1253 -1531L1252 -1553L1245 -1565L1243 -1578L1227 -1639L1228 -1658L1223 -1667L1224 -1691L1221 -1720L1200 -1778L1193 -1810L1190 -1850L1176 -1883L1163 -1901L1159 -1919L1147 -1924L1143 -1931L1141 -1939L1146 -1947L1140 -1937L1147 -1923L1158 -1919L1162 -1900L1171 -1890L1189 -1850L1193 -1808L1199 -1779L1205 -1753L1215 -1736L1216 -1724L1220 -1719L1223 -1690L1222 -1666L1226 -1657L1226 -1637L1233 -1608L1239 -1597L1243 -1567L1250 -1557L1252 -1531L1261 -1517L1255 -1499L1264 -1488L1266 -1478L1276 -1468L1279 -1417L1289 -1400L1306 -1396L1314 -1389L1330 -1388L1350 -1372L1357 -1361L1346 -1345L1350 -1328L1333 -1323L1318 -1299L1296 -1285L1295 -1281L1299 -1270L1297 -1264L1277 -1250L1257 -1220L1241 -1205L1234 -1185L1222 -1179L1223 -1167L1199 -1147L1184 -1129L1184 -1120L1177 -1110L1171 -1095L1171 -1083L1164 -1077L1167 -1071L1181 -1065L1184 -1038L1165 -1031L1161 -1026L1165 -1012L1173 -1002L1170 -994L1157 -982L1156 -977L1167 -959L1174 -932L1189 -916L1194 -901L1204 -889L1208 -873L1197 -858L1192 -847L1194 -837L1191 -830L1190 -809L1183 -796L1180 -770L1166 -750L1154 -744ZM132 625L139 632L131 642L132 647L138 652L148 656L180 642L192 643L207 661L215 667L219 665L224 670L236 690L238 704L244 714L242 720L225 731L216 742L189 758L178 777L191 797L204 805L212 804L221 815L226 834L223 845L214 856L220 872L236 872L223 901L201 932L215 954L229 962L252 968L271 985L280 1012L277 1028L279 1039L302 1080L308 1100L345 1121L365 1124L383 1122L398 1129L411 1141L411 1153L415 1163L449 1177L459 1190L467 1197L481 1196L491 1189L496 1189L509 1216L506 1223L509 1232L521 1246L522 1259L548 1272L561 1284L569 1283L574 1278L578 1261L582 1260L587 1263L595 1288L593 1305L596 1320L620 1371L621 1388L634 1416L657 1444L663 1456L682 1465L708 1490L714 1510L746 1543L751 1558L756 1561L790 1566L807 1576L820 1592L833 1602L841 1622L857 1639L859 1645L860 1643L871 1655L890 1663L909 1687L920 1696L922 1707L914 1751L920 1783L919 1801L944 1824L957 1847L985 1864L997 1876L994 1879L1016 1922L1020 1946L1030 1965L1042 1971L1073 1967L1088 1971L1107 1995L1115 2010L1138 2023L1139 2051L1132 2072L1134 2079L1151 2096L1166 2099L1171 2105L1173 2143L1187 2164L1212 2187L1232 2192L1240 2198L1247 2228L1249 2226L1250 2236L1255 2243L1271 2254L1269 2252L1279 2253L1285 2259L1293 2260L1316 2243L1330 2241L1348 2246L1361 2262L1364 2285L1376 2304L1373 2338L1387 2386L1382 2418L1385 2425L1385 2403L1386 2426L1396 2453L1414 2478L1431 2478L1441 2485L1443 2493L1447 2497L1475 2507L1482 2514L1499 2539L1501 2549L1497 2559L1499 2567L1510 2572L1521 2587L1517 2602L1520 2626L1512 2652L1509 2685L1513 2684L1511 2680L1514 2677L1515 2656L1523 2628L1521 2607L1529 2590L1512 2569L1500 2564L1499 2557L1503 2550L1503 2545L1489 2517L1476 2505L1451 2490L1432 2475L1412 2474L1405 2456L1405 2460L1396 2448L1388 2425L1387 2405L1396 2377L1394 2365L1380 2335L1380 2322L1386 2311L1378 2298L1378 2281L1367 2268L1364 2256L1350 2244L1329 2238L1315 2241L1299 2254L1283 2253L1254 2238L1248 2208L1242 2196L1232 2189L1214 2185L1191 2165L1173 2141L1176 2113L1174 2105L1165 2096L1151 2093L1136 2079L1135 2067L1141 2053L1145 2056L1141 2051L1140 2022L1115 2006L1108 1992L1110 1991L1099 1983L1088 1969L1075 1965L1039 1968L1032 1963L1021 1941L1019 1920L993 1868L958 1844L945 1820L921 1800L924 1787L919 1744L926 1705L922 1693L909 1683L893 1660L875 1653L863 1643L841 1618L837 1602L811 1576L793 1564L753 1555L747 1539L717 1508L710 1488L683 1461L665 1452L661 1443L638 1414L625 1388L627 1357L608 1338L601 1323L598 1306L600 1283L593 1263L586 1257L579 1256L574 1260L568 1278L561 1280L554 1271L529 1256L530 1247L523 1239L509 1198L497 1185L488 1183L479 1189L475 1185L459 1182L443 1167L423 1159L418 1153L417 1138L398 1122L387 1116L370 1113L353 1117L318 1101L314 1097L298 1065L289 1039L290 1012L281 1002L277 984L256 966L219 950L203 933L212 926L232 899L241 874L238 869L229 870L223 867L227 863L228 868L231 865L237 853L239 842L230 819L218 801L211 798L204 802L199 796L196 763L200 757L203 757L200 761L207 754L223 748L225 741L246 719L247 711L241 698L240 682L233 668L211 658L198 640L181 637L170 645L162 645L150 651L143 651L137 646L136 641L142 634L142 629L134 623L134 616L137 608L135 587L124 574L120 574L119 539L127 515L145 509L152 503L147 496L138 495L144 505L127 512L120 521L121 527L115 534L119 550L118 564L114 570L121 580L120 576L125 580L125 591L122 600L130 608L132 625ZM602 206L591 211L567 215L550 215L544 218L521 212L522 208L519 207L499 205L471 214L438 217L412 215L405 206L407 201L404 205L404 200L398 206L393 205L393 202L387 207L389 200L386 203L388 209L383 206L384 211L381 209L382 212L373 217L343 247L341 261L334 275L336 280L334 297L325 317L325 327L321 326L324 336L320 339L314 334L312 337L314 335L319 340L315 343L312 338L311 340L315 345L319 343L319 353L314 354L313 362L300 368L301 370L291 368L298 372L297 375L301 377L297 387L275 406L265 410L266 412L251 416L252 418L247 423L226 430L226 433L222 433L222 439L213 448L198 453L200 458L195 464L141 487L138 495L118 490L71 512L47 518L19 532L17 538L6 545L3 555L7 558L1 564L-4 562L-14 571L-24 572L-61 589L-87 594L-92 600L-125 615L-139 615L-155 619L-164 616L-189 621L-232 619L-253 634L-276 635L-295 641L-307 649L-330 653L-338 664L-350 670L-358 671L-362 666L-382 686L-398 697L-434 711L-471 733L-512 740L-538 736L-544 743L-574 754L-586 769L-591 771L-593 769L-591 773L-596 779L-617 794L-613 798L-623 797L-643 818L-653 820L-668 831L-696 838L-711 845L-730 844L-752 853L-783 860L-841 863L-860 860L-885 865L-908 859L-910 856L-909 846L-911 855L-920 859L-934 863L-947 861L-972 854L-992 841L-1006 840L-1019 829L-1037 826L-1043 821L-1048 808L-1058 800L-1064 788L-1113 741L-1120 726L-1130 736L-1151 738L-1165 743L-1184 757L-1202 779L-1223 797L-1248 849L-1272 876L-1300 891L-1325 897L-1362 916L-1366 918L-1371 915L-1368 919L-1395 949L-1414 982L-1453 1021L-1454 1031L-1443 1040L-1445 1042L-1460 1036L-1453 1042L-1463 1043L-1467 1039L-1464 1043L-1468 1051L-1492 1073L-1539 1090L-1567 1078L-1596 1083L-1613 1080L-1637 1094L-1694 1079L-1737 1097L-1746 1110L-1823 1152L-1875 1227L-1895 1242L-1915 1252L-1917 1258L-1914 1271L-1917 1288L-1931 1317L-1949 1391L-1947 1398L-1953 1431L-1964 1455L-1978 1472L-1974 1475L-1979 1476L-1980 1481L-1973 1489L-1978 1501L-2011 1544L-2014 1544L-2017 1539L-2021 1547L-2037 1546L-2060 1556L-2071 1564L-2088 1570L-2094 1577L-2104 1582L-2118 1581L-2130 1585L-2133 1582L-2139 1585L-2143 1576L-2152 1582L-2156 1581L-2167 1600L-2191 1610L-2203 1609L-2206 1604L-2204 1599L-2212 1598L-2217 1602L-2214 1610L-2220 1602L-2224 1611L-2225 1603L-2231 1617L-2234 1617L-2239 1617L-2233 1615L-2233 1612L-2243 1609L-2243 1611L-2255 1610L-2250 1611L-2253 1613L-2256 1610L-2255 1613L-2260 1619L-2274 1621L-2274 1618L-2269 1617L-2269 1613L-2288 1621L-2278 1612L-2279 1602L-2280 1599L-2288 1601L-2290 1596L-2298 1598L-2299 1585L-2296 1582L-2303 1590L-2305 1624L-2320 1625L-2349 1649L-2355 1657L-2362 1656L-2369 1661L-2372 1658L-2391 1671L-2418 1673L-2416 1683L-2422 1689L-2422 1687L-2429 1685L-2428 1677L-2425 1679L-2422 1672L-2433 1671L-2437 1677L-2450 1677L-2450 1687L-2456 1685L-2453 1687L-2454 1693L-2472 1710L-2502 1726L-2517 1740L-2533 1761L-2546 1773L-2559 1779L-2575 1800L-2597 1813L-2604 1804L-2606 1806L-2602 1809L-2611 1823L-2631 1836L-2650 1871L-2704 1930L-2760 1973L-2816 2005L-2823 2013L-2829 2011L-2828 2018L-2833 2027L-2855 2057L-2860 2056L-2862 2062L-2878 2065L-2874 2052L-2898 2073L-2898 2082L-2894 2084L-2900 2082L-2900 2072L-2931 1996L-2919 1986L-2889 1981L-2871 1963L-2856 1958L-2837 1947L-2777 1936L-2743 1919L-2738 1910L-2735 1911L-2732 1905L-2730 1906L-2732 1904L-2718 1887L-2712 1886L-2715 1883L-2700 1867L-2693 1854L-2689 1853L-2676 1834L-2673 1833L-2663 1817L-2668 1817L-2662 1814L-2652 1793L-2630 1773L-2631 1767L-2578 1743L-2579 1732L-2570 1727L-2562 1713L-2556 1708L-2538 1669L-2513 1644L-2484 1623L-2436 1606L-2378 1568L-2352 1559L-2327 1557L-2307 1550L-2261 1494L-2224 1471L-2182 1463L-2108 1457L-2084 1447L-2084 1442L-2075 1446L-2051 1435L-2037 1409L-2030 1369L-2019 1337L-2012 1288L-1989 1246L-1987 1228L-1989 1222L-1993 1220L-1985 1219L-1983 1207L-1963 1183L-1941 1131L-1935 1129L-1931 1124L-1923 1127L-1915 1121L-1909 1122L-1902 1105L-1890 1104L-1859 1088L-1858 1085L-1868 1088L-1857 1083L-1840 1061L-1859 1065L-1837 1058L-1841 1055L-1852 1056L-1830 1055L-1787 1031L-1779 1023L-1763 1023L-1765 1021L-1761 1019L-1748 1018L-1747 1013L-1743 1021L-1742 1013L-1738 1016L-1735 1011L-1729 1012L-1726 1018L-1724 1011L-1718 1011L-1711 1021L-1715 1012L-1710 1014L-1711 1010L-1707 1011L-1707 1009L-1695 1014L-1694 1003L-1686 1002L-1684 1006L-1681 995L-1678 999L-1672 999L-1667 990L-1670 999L-1678 1001L-1654 1002L-1655 993L-1654 996L-1651 992L-1653 1002L-1648 1001L-1640 1004L-1641 997L-1638 1004L-1634 1004L-1633 990L-1632 1005L-1627 1002L-1630 993L-1625 1007L-1620 1002L-1622 1007L-1619 1008L-1621 1012L-1616 1011L-1617 1016L-1614 1022L-1617 1026L-1615 1023L-1615 1030L-1614 1026L-1612 1028L-1617 1015L-1615 1011L-1608 1012L-1608 1016L-1608 1012L-1605 1012L-1599 1021L-1609 1008L-1609 1004L-1595 1010L-1594 1007L-1591 1009L-1594 1001L-1591 999L-1580 1005L-1580 1002L-1575 1004L-1581 999L-1578 998L-1577 1002L-1572 994L-1567 997L-1567 1001L-1565 997L-1563 1000L-1548 995L-1546 999L-1547 994L-1527 980L-1493 932L-1473 909L-1450 896L-1448 889L-1433 876L-1416 870L-1379 838L-1359 827L-1359 825L-1343 824L-1326 806L-1319 804L-1310 806L-1300 804L-1296 800L-1292 780L-1272 762L-1268 746L-1270 742L-1258 729L-1249 708L-1236 688L-1203 668L-1189 693L-1187 691L-1190 689L-1187 687L-1190 688L-1192 684L-1191 683L-1185 686L-1186 689L-1185 686L-1196 678L-1202 668L-1200 664L-1196 665L-1198 663L-1161 664L-1157 667L-1142 660L-1113 655L-1070 673L-994 729L-954 736L-928 734L-910 723L-901 720L-896 731L-889 731L-886 727L-871 731L-845 731L-818 726L-796 733L-795 731L-783 733L-781 736L-774 726L-763 723L-746 712L-722 709L-692 679L-676 681L-672 686L-675 680L-671 670L-645 653L-631 648L-615 648L-610 640L-596 637L-589 637L-581 643L-573 638L-562 645L-551 646L-534 639L-520 640L-504 629L-487 610L-480 608L-477 611L-461 596L-436 584L-380 576L-353 567L-351 562L-333 556L-298 551L-285 545L-260 542L-260 539L-259 542L-245 539L-239 542L-219 535L-217 532L-207 534L-201 525L-189 520L-182 522L-151 515L-118 524L-88 518L-67 523L-33 505L-25 495L-24 489L-17 486L-15 479L-6 475L-4 479L8 480L53 468L62 472L80 469L86 472L104 475L151 452L150 450L176 420L198 403L213 398L216 394L217 396L217 376L223 366L229 362L234 364L227 361L230 355L233 354L235 362L237 347L253 342L251 332L270 319L279 309L281 308L282 311L301 287L312 247L304 247L303 240L313 239L313 245L319 225L314 226L311 234L281 236L276 239L273 236L290 226L288 219L294 217L298 221L325 203L327 191L320 181L310 180L299 187L296 185L305 164L298 162L302 150L309 148L310 140L311 144L327 142L348 134L352 137L352 132L377 118L392 98L395 103L393 97L400 86L406 87L410 84L412 67L423 49L432 44L431 38L444 21L456 15L471 -3L490 -14L503 -16L510 -23L513 -21L516 -24L515 -26L511 -23L513 -27L549 -57L602 -90L620 -110L618 -120L624 -112L635 -124L641 -136L639 -140L645 -148L643 -155L648 -166L652 -166L654 -174L658 -172L664 -184L696 -224L741 -264L735 -272L745 -267L779 -293L780 -297L783 -296L792 -303L832 -352L842 -358L840 -364L841 -363L873 -386L895 -399L897 -397L907 -406L916 -399L914 -408L924 -416L997 -453L1004 -462L999 -468L1002 -477L1006 -478L1014 -471L1053 -484L1122 -498L1136 -495L1179 -501L1203 -526L1211 -543L1233 -568L1279 -608L1314 -618L1424 -456L1456 -371L1595 -300L1605 -287L1596 -286L1577 -274L1574 -275L1573 -272L1532 -239L1530 -233L1448 -180L1388 -130L1378 -128L1366 -137L1359 -133L1356 -139L1359 -144L1335 -131L1333 -125L1337 -125L1336 -115L1330 -113L1325 -116L1323 -119L1325 -122L1295 -99L1292 -67L1263 -36L1245 -36L1238 -34L1239 -32L1230 -38L1223 -40L1223 -36L1222 -43L1210 -58L1206 -71L1197 -61L1191 -60L1189 -53L1173 -47L1172 -40L1153 -17L1130 -4L1123 12L1104 33L1065 29L1063 34L1063 12L1048 20L1037 3L1024 16L1017 17L1010 14L1000 20L959 55L956 56L953 50L955 55L950 61L931 61L907 70L894 81L881 94L879 101L871 106L865 124L857 130L849 129L837 145L809 166L798 177L792 179L782 187L780 194L765 193L731 205L724 203L723 199L705 200L697 196L685 197L682 194L663 202L653 197L639 196L637 190L639 188L636 187L631 189L636 190L635 198L629 201L616 200L602 206ZM1198 -419L1181 -419L1176 -412L1167 -414L1161 -407L1155 -407L1140 -401L1114 -409L1114 -416L1097 -418L1064 -407L1043 -395L1025 -393L1020 -388L982 -366L899 -337L872 -313L860 -296L828 -264L803 -224L747 -158L710 -126L640 -89L622 -62L587 -28L552 -10L546 -3L540 10L538 4L533 8L534 10L538 9L538 13L516 30L506 46L488 61L462 114L441 137L441 151L451 160L464 162L485 145L495 149L531 147L538 151L542 148L556 151L568 146L580 149L597 143L607 144L614 142L623 146L629 144L623 142L643 131L655 129L661 121L669 127L687 128L717 116L730 118L736 113L740 120L743 119L739 117L742 115L745 119L742 113L791 74L803 56L818 43L823 30L838 15L848 10L850 2L846 -5L854 0L871 -8L878 -7L890 -19L904 -26L905 -29L900 -32L911 -29L935 -39L968 -60L973 -67L980 -69L981 -66L990 -78L995 -78L1003 -91L1019 -104L1037 -150L1044 -157L1071 -199L1096 -229L1094 -242L1097 -238L1104 -242L1126 -262L1141 -283L1153 -309L1161 -316L1163 -323L1172 -331L1176 -328L1172 -331L1185 -363L1185 -381L1193 -389L1202 -406L1198 -419ZM357 -36L358 -26L376 -29L374 -26L381 -10L394 4L401 4L407 -3L416 -1L423 7L424 22L435 34L437 30L427 17L429 14L425 12L424 5L412 -4L407 -4L398 3L393 1L383 -10L376 -24L377 -31L372 -32L375 -47L381 -58L377 -69L378 -77L388 -89L392 -100L391 -104L384 -107L368 -102L368 -94L353 -83L349 -83L344 -90L338 -91L345 -87L337 -90L348 -81L344 -79L346 -79L369 -93L370 -102L383 -106L390 -101L386 -89L376 -76L378 -56L370 -45L357 -38L357 -43L361 -43L362 -48L357 -45L357 -36ZM324 -137L321 -113L323 -97L337 -87L324 -106L327 -119L325 -136L331 -154L317 -192L305 -210L303 -220L293 -238L293 -248L298 -256L314 -263L322 -274L317 -289L320 -308L323 -325L351 -339L335 -334L321 -325L315 -291L321 -274L309 -262L299 -258L291 -250L292 -238L296 -228L293 -220L295 -212L310 -197L314 -181L328 -160L328 -152L324 -137ZM559 -743L546 -733L538 -722L534 -695L509 -664L500 -667L494 -666L478 -647L470 -645L447 -629L442 -613L398 -581L395 -564L402 -554L409 -521L418 -509L417 -501L406 -481L407 -470L397 -460L395 -435L371 -428L362 -419L364 -427L361 -424L364 -406L353 -391L355 -370L356 -348L348 -339L357 -344L360 -373L357 -375L355 -389L366 -406L366 -420L370 -426L396 -434L398 -460L407 -468L407 -481L419 -499L418 -510L411 -520L402 -555L396 -566L399 -580L442 -611L448 -628L471 -643L482 -647L495 -664L501 -666L508 -662L511 -663L535 -694L541 -723L559 -743ZM536 -912L530 -918L521 -919L521 -924L503 -933L486 -934L481 -940L465 -942L448 -953L443 -967L426 -979L415 -982L402 -998L396 -1020L397 -1031L396 -1018L400 -999L414 -981L425 -979L443 -964L446 -953L454 -946L467 -940L480 -939L481 -936L491 -931L505 -932L519 -923L520 -918L529 -917L535 -909L545 -906L549 -899L549 -892L555 -885L580 -863L583 -851L591 -838L606 -835L608 -820L607 -814L601 -812L583 -774L567 -763L559 -743L562 -743L563 -752L568 -761L584 -773L594 -787L594 -796L602 -808L609 -812L610 -819L607 -836L591 -840L576 -872L562 -882L557 -891L551 -892L547 -906L536 -912ZM599 667L584 686L582 696L558 713L547 727L588 751L585 760L590 766L603 765L604 771L596 778L595 786L601 802L613 819L629 825L635 832L645 838L651 837L655 841L670 838L677 848L694 848L705 854L727 855L735 860L778 863L793 868L812 867L820 883L860 886L867 893L875 892L876 905L885 915L882 920L875 923L877 932L885 937L898 940L901 952L920 961L928 969L959 968L964 970L969 978L981 975L1008 975L1017 972L1016 970L1029 967L1035 969L1074 965L1086 972L1101 971L1116 981L1125 983L1131 988L1136 1006L1146 1015L1146 1030L1139 1043L1134 1046L1131 1056L1133 1058L1129 1066L1130 1084L1140 1091L1149 1108L1156 1113L1148 1105L1178 1117L1174 1129L1178 1137L1192 1138L1209 1151L1222 1152L1227 1175L1220 1196L1233 1205L1243 1227L1279 1236L1304 1251L1312 1251L1319 1259L1335 1260L1340 1273L1359 1286L1368 1298L1379 1299L1385 1302L1400 1299L1411 1292L1415 1281L1427 1275L1446 1276L1460 1268L1468 1258L1476 1260L1487 1257L1503 1276L1518 1285L1526 1301L1533 1300L1533 1309L1539 1319L1542 1317L1539 1313L1547 1315L1549 1312L1549 1314L1549 1309L1555 1315L1570 1319L1566 1334L1572 1332L1574 1338L1581 1335L1581 1340L1577 1344L1594 1349L1590 1356L1595 1361L1604 1358L1605 1361L1597 1366L1608 1375L1606 1381L1615 1389L1610 1387L1607 1389L1610 1395L1604 1396L1601 1401L1605 1413L1592 1425L1598 1445L1594 1467L1587 1468L1584 1473L1591 1493L1588 1508L1574 1518L1559 1546L1555 1562L1541 1576L1543 1584L1534 1595L1536 1619L1550 1626L1550 1634L1545 1636L1547 1640L1550 1638L1555 1641L1554 1632L1560 1634L1559 1640L1563 1640L1568 1627L1572 1630L1570 1638L1572 1640L1574 1634L1578 1640L1590 1639L1593 1632L1599 1636L1599 1631L1606 1633L1607 1630L1601 1626L1608 1625L1603 1622L1612 1621L1612 1617L1603 1619L1612 1610L1617 1612L1617 1619L1644 1602L1664 1585L1669 1575L1689 1565L1707 1533L1730 1523L1729 1515L1739 1510L1743 1492L1754 1487L1752 1475L1757 1475L1755 1469L1766 1456L1770 1455L1774 1465L1785 1461L1789 1464L1796 1448L1794 1445L1800 1436L1797 1432L1802 1430L1795 1429L1795 1426L1803 1406L1814 1403L1818 1398L1824 1397L1827 1402L1834 1401L1839 1392L1849 1392L1852 1382L1850 1384L1847 1381L1852 1377L1852 1369L1859 1360L1887 1359L1888 1351L1904 1340L1913 1328L1919 1334L1923 1327L1944 1332L1948 1325L1968 1313L1978 1287L1997 1281L1994 1284L1995 1291L1997 1281L1977 1287L1967 1314L1948 1324L1943 1331L1939 1332L1929 1326L1923 1326L1919 1333L1913 1327L1903 1339L1887 1351L1886 1358L1870 1361L1863 1358L1857 1362L1851 1369L1851 1377L1847 1381L1851 1384L1850 1390L1838 1391L1834 1401L1827 1401L1825 1396L1817 1398L1814 1403L1803 1405L1794 1426L1795 1430L1801 1430L1797 1432L1800 1436L1794 1445L1796 1448L1789 1463L1785 1460L1774 1465L1770 1454L1766 1455L1755 1468L1757 1474L1751 1475L1750 1480L1753 1487L1742 1492L1739 1510L1729 1514L1729 1523L1723 1523L1712 1531L1707 1532L1687 1565L1668 1575L1664 1584L1644 1601L1617 1619L1618 1612L1612 1610L1603 1620L1612 1618L1612 1620L1602 1622L1607 1625L1601 1626L1602 1629L1607 1630L1605 1632L1600 1630L1597 1632L1599 1635L1594 1632L1590 1638L1577 1640L1575 1634L1573 1639L1571 1638L1573 1630L1567 1626L1563 1639L1560 1639L1561 1633L1554 1631L1554 1641L1550 1638L1547 1639L1546 1636L1550 1635L1551 1626L1536 1618L1535 1595L1545 1583L1541 1576L1558 1559L1557 1554L1573 1522L1581 1512L1589 1508L1592 1493L1585 1473L1595 1467L1599 1445L1593 1426L1606 1414L1601 1403L1605 1396L1610 1396L1608 1389L1615 1388L1607 1380L1610 1376L1598 1366L1606 1361L1604 1358L1595 1360L1591 1356L1594 1348L1577 1343L1582 1339L1582 1334L1574 1337L1574 1332L1567 1333L1571 1318L1556 1314L1549 1308L1547 1314L1538 1313L1539 1318L1533 1308L1534 1299L1527 1300L1518 1284L1505 1276L1488 1256L1476 1259L1468 1256L1451 1274L1426 1274L1414 1281L1412 1290L1399 1298L1388 1301L1378 1297L1369 1298L1360 1285L1342 1272L1336 1259L1319 1257L1313 1250L1304 1249L1278 1233L1245 1226L1235 1211L1234 1204L1224 1197L1229 1171L1224 1152L1211 1149L1193 1136L1178 1135L1176 1129L1180 1120L1179 1115L1147 1100L1142 1092L1131 1081L1131 1073L1133 1074L1130 1066L1135 1051L1147 1031L1148 1016L1138 1004L1132 987L1125 980L1117 980L1102 970L1087 970L1075 962L1054 963L1037 967L1022 965L1002 974L977 972L969 976L960 965L929 967L902 951L903 943L899 938L885 934L877 926L877 923L884 921L886 915L885 910L877 904L876 891L867 892L861 885L850 886L841 882L831 885L831 881L821 877L820 869L809 863L790 865L776 860L736 857L723 848L708 850L693 844L678 844L673 836L657 840L636 832L629 823L620 819L613 813L598 792L597 785L602 782L606 765L602 762L590 764L588 760L591 754L589 749L555 731L550 725L560 713L583 698L585 687L594 680L604 665L604 659L595 649L589 645L575 651L568 650L558 637L563 632L562 627L544 621L538 609L524 604L507 588L499 586L489 588L489 574L481 573L474 561L460 554L446 522L435 511L425 507L415 491L406 498L396 489L381 499L373 500L352 485L341 489L330 486L289 497L283 490L284 475L273 464L283 460L282 454L286 442L276 439L274 433L249 437L240 434L250 438L272 434L276 440L285 443L280 454L281 458L271 466L280 473L283 481L281 492L289 499L329 488L346 493L357 492L361 497L374 501L382 500L395 491L406 500L414 493L420 507L435 514L446 526L447 536L458 554L475 566L478 589L483 589L477 585L478 572L487 589L500 588L509 592L519 604L533 610L544 624L560 628L561 632L556 638L565 651L574 654L590 648L602 659L599 667ZM-413 65L-416 80L-413 89L-418 91L-416 88L-435 91L-448 101L-464 104L-469 112L-486 111L-496 118L-504 130L-510 129L-542 146L-573 146L-574 142L-583 141L-587 143L-590 151L-603 147L-623 152L-627 151L-627 148L-633 149L-635 146L-633 150L-626 149L-630 158L-611 153L-586 153L-576 148L-551 152L-531 149L-521 137L-511 139L-505 138L-500 133L-497 134L-501 132L-495 122L-484 114L-465 115L-460 112L-459 105L-445 103L-437 94L-423 91L-414 95L-411 89L-413 84L-413 71L-402 38L-412 26L-412 7L-402 8L-394 -5L-379 -14L-366 -41L-369 -63L-365 -78L-368 -85L-379 -90L-365 -137L-354 -158L-337 -158L-333 -177L-327 -177L-322 -171L-302 -164L-294 -165L-291 -171L-291 -181L-304 -189L-305 -205L-311 -208L-320 -220L-312 -260L-317 -272L-328 -273L-334 -278L-341 -314L-326 -318L-318 -338L-319 -355L-316 -372L-322 -375L-319 -373L-322 -372L-321 -371L-327 -371L-338 -387L-327 -396L-327 -414L-322 -433L-304 -459L-301 -488L-289 -499L-266 -500L-261 -509L-228 -506L-215 -512L-208 -508L-192 -517L-190 -542L-186 -552L-192 -565L-189 -584L-167 -603L-167 -608L-157 -615L-154 -610L-130 -616L-120 -614L-100 -627L-88 -653L-89 -663L-74 -692L-66 -701L-56 -702L-52 -716L-42 -728L-41 -741L-50 -757L-44 -770L-47 -791L-27 -805L-28 -826L-34 -833L-36 -852L-44 -873L-67 -898L-67 -910L-87 -938L-89 -949L-94 -951L-105 -974L-113 -981L-124 -1005L-124 -1016L-136 -1034L-141 -1050L-148 -1061L-148 -1069L-157 -1084L-158 -1093L-162 -1093L-162 -1101L-179 -1147L-183 -1147L-173 -1124L-169 -1104L-161 -1086L-149 -1070L-150 -1063L-135 -1026L-126 -1017L-123 -996L-110 -972L-100 -961L-91 -938L-79 -927L-63 -887L-44 -864L-30 -822L-29 -805L-46 -796L-48 -791L-46 -769L-53 -759L-45 -743L-44 -731L-52 -724L-59 -704L-66 -704L-76 -693L-80 -681L-89 -668L-92 -659L-89 -654L-101 -630L-112 -620L-121 -616L-131 -617L-152 -613L-159 -617L-174 -607L-179 -597L-190 -590L-195 -562L-188 -552L-195 -534L-194 -537L-198 -541L-194 -527L-197 -516L-206 -511L-217 -514L-229 -507L-246 -507L-258 -512L-268 -501L-293 -500L-311 -480L-310 -457L-324 -434L-329 -413L-329 -396L-340 -390L-331 -373L-327 -369L-318 -368L-317 -366L-321 -357L-326 -328L-334 -318L-339 -319L-343 -316L-342 -294L-335 -273L-317 -267L-315 -253L-325 -232L-323 -220L-316 -210L-308 -185L-294 -180L-296 -174L-306 -169L-321 -173L-328 -179L-334 -178L-338 -160L-342 -158L-354 -160L-369 -136L-381 -90L-367 -79L-371 -65L-369 -39L-379 -18L-396 -7L-404 2L-404 6L-415 0L-422 8L-414 27L-405 37L-413 65ZM-39 872L-37 868L-37 853L-1 838L23 837L26 834L26 830L16 830L15 827L26 824L44 826L48 816L29 818L42 811L60 806L63 797L82 798L89 787L102 790L103 786L101 778L111 775L119 757L131 750L153 746L173 733L178 710L171 704L167 689L161 687L165 677L164 669L154 653L151 655L163 668L163 679L160 687L167 690L170 704L176 710L172 732L154 743L141 745L121 754L110 774L100 777L101 789L87 786L82 797L65 795L61 798L60 805L30 816L29 820L47 817L44 825L28 823L18 825L14 828L24 829L24 836L1 836L-38 852L-38 866L-42 875L-54 884L-46 899L-63 919L-60 924L-64 934L-56 957L-49 960L-35 959L-32 963L-35 972L-51 989L-44 992L-33 1014L-38 1020L-53 1023L-56 1034L-51 1041L-51 1049L-44 1053L-40 1059L-40 1068L-31 1072L-43 1096L-39 1106L-45 1111L-43 1117L-56 1123L-59 1132L-56 1143L-60 1151L-55 1157L-60 1170L-52 1172L-52 1190L-41 1197L-45 1203L-59 1209L-66 1218L-52 1235L-49 1244L-44 1244L-30 1252L-19 1248L-14 1252L-20 1254L-18 1258L-4 1260L-5 1265L0 1272L-1 1278L-6 1283L-15 1282L-18 1285L-13 1295L-5 1299L0 1299L-9 1313L-9 1327L-5 1330L6 1332L8 1346L19 1349L24 1348L31 1356L30 1371L32 1378L26 1392L35 1404L18 1411L22 1415L17 1417L18 1444L20 1448L32 1454L24 1459L30 1472L46 1475L50 1489L61 1499L64 1511L74 1509L79 1519L95 1520L98 1534L116 1529L118 1525L124 1525L128 1530L133 1529L132 1538L137 1537L155 1542L161 1552L169 1553L170 1556L176 1552L182 1560L192 1564L243 1557L244 1561L251 1563L243 1557L192 1564L181 1559L181 1555L176 1552L170 1555L169 1553L161 1552L154 1541L137 1536L132 1537L134 1529L128 1529L124 1525L98 1533L96 1520L79 1518L74 1509L64 1510L63 1500L51 1489L46 1474L31 1472L25 1462L25 1459L33 1455L20 1447L17 1426L18 1417L22 1416L21 1411L37 1403L27 1394L33 1378L30 1371L32 1357L24 1347L18 1348L9 1345L6 1331L-8 1326L-8 1312L1 1298L-14 1293L-17 1284L-5 1284L-1 1279L1 1272L-4 1265L-4 1259L-16 1258L-17 1254L-13 1252L-19 1247L-29 1251L-43 1243L-49 1244L-53 1233L-65 1218L-58 1209L-48 1206L-41 1198L-42 1193L-51 1190L-50 1172L-59 1170L-55 1157L-59 1150L-56 1144L-59 1132L-54 1123L-43 1118L-43 1111L-38 1106L-43 1096L-30 1072L-39 1067L-42 1053L-51 1048L-48 1038L-55 1035L-51 1023L-38 1021L-32 1015L-43 992L-50 988L-34 974L-31 962L-35 958L-48 959L-54 956L-62 934L-59 924L-61 919L-56 915L-52 905L-45 900L-53 883L-39 872ZM-630 226L-623 222L-622 210L-641 191L-644 183L-640 166L-630 158L-630 154L-641 162L-647 179L-644 190L-624 212L-626 222L-632 223L-638 227L-640 237L-647 240L-644 234L-646 235L-657 249L-678 267L-670 267L-661 260L-637 239L-635 230L-630 226Z",
    "riv": [{
      "n": "Rivière Montmorency",
      "d": "M522 -2126L516 -2121L515 -2116L511 -2114L505 -2100L507 -2089L499 -2067L499 -2054L495 -2047L491 -2047L492 -2033L488 -2033L481 -2025L479 -2004L473 -1991L461 -1988L463 -1976L459 -1975L459 -1971L454 -1969L455 -1967L448 -1966L447 -1958L444 -1961L436 -1957L431 -1944L433 -1940L427 -1925L418 -1918L399 -1888L396 -1874L390 -1868L382 -1846L361 -1824L342 -1784L338 -1782L340 -1763L334 -1758L321 -1763L316 -1749L309 -1747L308 -1742L293 -1729L300 -1718L312 -1707L314 -1693L325 -1684L329 -1665L337 -1659L339 -1641L343 -1639L343 -1632L354 -1606L380 -1560L405 -1524L405 -1513L419 -1485L431 -1481L437 -1476L447 -1461L446 -1452L451 -1446L449 -1440L450 -1421L448 -1417L449 -1386L445 -1380L458 -1354L454 -1311L450 -1304L456 -1298L453 -1273L461 -1257L450 -1220L455 -1210L448 -1195L449 -1159L442 -1147L439 -1133L432 -1128L428 -1094L415 -1078L396 -1027L401 -999L416 -981L425 -979L445 -964L445 -956L450 -950L466 -941L481 -940L489 -932L505 -932L521 -923L520 -919L528 -919L537 -909L547 -905L550 -893L579 -867L591 -839L607 -836L609 -824L609 -815L600 -808L585 -777L568 -762L561 -752L560 -743L544 -730L538 -719L535 -695L509 -663L502 -666L494 -665L480 -646L469 -643L447 -628L441 -611L398 -580L395 -564L402 -555L410 -520L419 -507L417 -497L407 -482L406 -468L397 -459L396 -435L369 -426L364 -418L364 -403L354 -388L359 -370L355 -343L321 -323L316 -292L321 -274L311 -261L300 -258L292 -250L295 -232L303 -219L303 -207L317 -191L326 -171L329 -152L322 -112L326 -94L343 -87L350 -80L369 -94L368 -102L384 -106L391 -102L388 -91L378 -77L379 -56L371 -31L377 -30L376 -24L382 -10L391 1L399 4L407 -3L412 -3L423 5L428 24L436 32M309 -201L306 -204M305 -203L297 -207L293 -217L296 -230M313 -195L315 -181L326 -165"
    }, {
      "n": "Rivière du Berger",
      "d": "M74 -16L75 -14M85 229L88 231M79 228L85 229M79 227L79 228M76 -13L82 -7M87 7L87 8M84 -7L84 -7M75 -24L73 -21M82 -7L83 -7M86 13L86 13M87 3L87 3M84 -7L89 -1L87 3M83 -7L84 -7M73 -19L74 -16M87 3L87 5M75 -14L76 -13M95 27L100 37L98 45L108 77L88 84L75 84L70 80L59 84L53 90L53 97L40 106L32 125L34 132L30 134L32 143L37 150L44 153L44 158L50 163L46 167L49 169L46 170L52 171L49 173L55 182L55 189L64 204L61 209L72 224L78 223L79 227M87 8L86 13M73 -21L73 -19M82 -32L75 -24M91 234L92 235M88 231L88 231M88 231L88 232M88 232L91 234M101 247L102 250L93 250L94 254L100 257M83 -38L82 -32M82 -32L82 -32M82 -38L83 -38M84 -43L82 -38M84 -43L84 -43M83 -59L84 -43M86 13L95 26M95 26L95 27M101 257L104 258L107 266L98 268L91 275M100 257L101 257M87 6L87 7M87 5L87 6M92 235L95 240L93 243L101 247M101 247L101 247"
    }, {
      "n": "Rivière Saint-Charles",
      "d": "M-66 52L-68 55L-65 59L-73 60L-69 67L-75 75L-73 82L-75 91L-66 95L-59 111L-56 113L-50 110L-46 123L-35 125L-33 129L-21 128L-17 137L-16 157L-8 163L-4 173L-5 182L-2 196L-6 199L-5 202L-9 207L18 204L22 218L17 218L24 225L44 233L47 246L45 254L51 260L50 278L54 278L53 273L58 272L63 283L66 284L69 282L69 273L73 274L77 271L78 275L73 280L77 284L79 278L85 278L88 274L103 278L114 272L117 275L117 283L130 284L138 279L142 267L152 265L158 281L178 281L192 273L205 258L212 259L218 256L226 230L234 231L254 245L274 238M-70 -51L-66 -47L-67 -42L-56 -36L-57 -33L-53 -28L-49 -29L-50 -25L-54 -26L-51 -18L-54 -17L-53 -9L-57 -8L-57 -4L-41 -5L-42 2L-36 2L-34 10L-40 18L-47 13L-50 15L-48 19L-54 22L-56 21L-51 25L-53 27L-51 29L-57 30L-56 34L-67 41L-67 43L-60 44L-66 52M274 238L318 217L351 208"
    }],
    "aut": "M240 245L232 244M272 263L271 242M14 -53L21 -52M260 131L270 125M129 539L128 552M131 550L131 532M201 529L247 507M0 -121L-2 -78M14 -53L8 -55M3 -58L-2 -75L0 -114M8 -54L14 -53M160 175L168 187M433 33L427 42M375 118L326 141M505 -31L481 -13M401 85L409 84L414 63M0 -114L-3 -134L-24 -163M19 164L9 150M32 179L40 182M64 23L54 1M64 26L68 37M-153 112L-188 86M-242 61L-276 49M-123 165L-111 187L-87 212M174 183L181 179M161 191L152 197M118 314L114 324M115 326L140 323M113 334L114 327M108 340L109 348M140 205L150 198M147 157L157 170M137 146L128 133M270 245L271 264M293 180L285 194M294 179L298 167M388 75L393 80M371 63L380 68M427 42L434 32M303 82L289 95M338 57L350 61M266 127L254 132M225 244L236 244M207 233L212 238M128 134L142 152M128 132L99 82M53 2L63 24M52 -29L49 -40M627 -137L660 -190M866 -385L854 -376M110 469L120 496M-652 1142L-574 1108L-503 1031M127 501L122 498M118 504L122 511M91 226L85 217M98 327L92 328M107 462L110 469M208 756L204 748M203 748L208 756M201 742L175 681M131 532L131 525M160 647L157 641M181 700L193 727M533 1221L546 1239L562 1243M436 29L448 18M697 1405L703 1414M-31 383L-39 390M68 37L94 78M69 35L65 26M1014 -513L1022 -520M-252 427L-204 447M56 342L48 345M92 229L98 238M113 269L112 259M5 363L19 357M-1 365L-14 370M128 557L138 600M27 255L38 250M191 172L198 168M189 173L183 177M199 167L209 161M209 160L202 164M210 160L221 153M234 144L222 151M-24 -162L-4 -135L0 -121M-24 -163L-49 -222L-53 -260M989 -488L980 -480M908 -410L898 -404M980 -478L989 -488M941 -431L958 -441M914 -413L924 -420M971 -448L977 -453M777 -309L735 -270M852 -374L858 -378M898 -404L866 -385M979 -468L977 -453M1002 -501L996 -495M-247 824L-377 895M-246 824L-192 791L-148 774M108 567L99 581M122 511L127 518M127 518L122 510M122 510L118 504M682 1367L650 1275L604 1249M703 1416L746 1468M287 489L280 492M280 493L288 490M-149 773L-191 790L-246 824M189 535L137 548L121 558M586 1243L602 1249M562 1242L546 1237L535 1221M157 640L140 612L138 592M603 1248L586 1242M604 1250L647 1274L680 1368M336 465L287 489M748 250L790 253L841 229L895 185M-503 1030L-575 1107L-653 1141M-374 893L-247 825M-383 474L-318 453M-590 566L-654 586M735 -270L721 -254M736 -270L779 -311M1069 79L1053 79M1053 80L1068 80M1074 80L1099 80M-188 86L-224 69M-64 410L-58 406M-139 451L-169 461M29 -50L50 -39L52 0M21 -52L14 -53M3 143L9 151M3 143L-1 130M294 92L306 80M288 97L280 107M303 147L297 163M62 240L97 226M35 351L24 355M65 339L73 336M394 79L388 75M155 167L148 157M155 195L167 187M297 167L294 178M-649 587L-571 561M301 151L306 145M336 137L381 113M130 323L117 325M159 320L167 319M138 600L147 621M109 346L109 340M109 348L113 352M120 363L116 357M116 357L120 363M90 429L83 430M85 431L96 427M25 295L31 301M92 427L91 435M102 466L100 460M72 376L76 386M46 317L51 325M95 442L92 427M89 418L86 411M116 499L104 469M103 469L116 499M46 406L42 401M-27 349L-23 353M505 -30L544 -57M457 10L463 5M-54 -284L-51 -227L-25 -163M-53 -266L-53 -284M27 -471L10 -506L-25 -537L-26 -619L-17 -646M-53 -285L-28 -352M-324 455L-383 472M-289 440L-254 427M-28 -353L-25 -366M-29 -352L-54 -285M26 -469L24 -434L-13 -398L-28 -353M-25 -366L-12 -399L24 -432L27 -469M-16 373L-1 366M418 56L427 43M298 166L301 151M111 285L112 275M115 298L111 287M37 250L29 253M214 240L220 242M313 143L322 142M168 188L164 180M168 187L188 220M996 -495L990 -490M-113 438L-89 426M76 386L72 375M52 326L48 318M126 212L120 215M5 274L13 282M63 353L59 344M91 329L112 326M98 237L94 230M105 223L110 221M150 198L155 195M180 178L168 186M114 218L61 240M56 336L58 342M58 241L47 245M99 585L107 571M107 571L117 563M59 420L64 424M-56 232L-76 221L-115 176M-70 227L-43 240M-18 -646L-27 -617L-26 -537L10 -505L26 -471M-13 -659L-11 -675M35 304L40 311M33 302L26 294M-39 390L-26 380M-59 405L-66 411M275 211L293 180M95 77L69 35M106 96L127 132M72 196L65 188M174 315L161 319M448 18L457 10M447 16L436 29M-42 239L-56 232M19 288L25 294M704 1413L698 1404M696 1400L683 1369M744 1462L704 1415M-448 973L-386 905M-387 905L-449 972M-450 973L-502 1029M-502 1030L-449 974M748 249L696 242L612 265L575 261M1100 79L1074 79M100 458L98 452M463 5L481 -13M458 8L447 16M579 -81L544 -57M546 -58L580 -81M582 -82L603 -98L626 -135M625 -134L603 -99L580 -82M130 554L151 546M204 527L194 532M279 493L262 500M151 546L193 534M680 1369L695 1402M114 327L116 317M116 317L120 307M-128 153L-146 123M12 279L12 263M-9 359L-3 361M26 385L35 395M958 -441L965 -445M32 178L28 174M-58 406L-42 393M-46 395L-59 405M275 211L270 240M272 217L275 211M326 141L315 142M854 -376L839 -365M839 -365L852 -374M175 198L168 188M198 227L204 231M715 -242L704 -233M721 -254L735 -269M-255 425L-261 425M123 215L133 209M162 177L155 167M146 155L137 146M68 338L59 341M82 332L75 335M99 581L85 638L7 693M-22 709L15 690L76 646M-231 66L-225 69M172 674L161 651M161 651L171 675M363 1041L349 1022L327 976M327 977L346 1024L362 1042M307 957L323 973M324 972L307 956M303 952L294 942M294 943L303 953M289 937L278 921L273 867L221 782M231 805L269 863L275 919L289 938M569 1243L585 1243M584 1242L569 1242M532 1214L514 1183L460 1138M459 1139L511 1182L530 1215M454 1133L433 1112M432 1113L453 1134M372 1051L429 1109M429 1108L372 1051M-26 246L-34 243M321 66L327 60M415 59L386 105M26 355L37 350M-13 -665L-16 -651M-16 -651L-13 -659M181 179L190 173M16 376L3 366M56 416L50 409M76 431L68 427M149 198L139 205M242 138L237 142M129 523L130 531M93 441L96 447M133 570L132 563M132 563L131 555M49 -40L22 -52M53 0L51 -22M22 290L16 284M55 332L52 326M59 342L55 332M47 346L35 351M112 326L105 327M182 210L175 198M205 231L198 227M211 237L206 232M37 350L47 346M41 401L49 408M3 257L-3 264M-653 1142L-661 1151L-679 1206L-690 1218M349 443L366 410M368 407L383 378M608 266L651 255M456 311L509 280M431 334L443 323M20 257L5 257M16 358L4 363M-4 264L2 270M704 -233L680 -211M704 -233L715 -241M12 280L-2 264M-3 263L-10 256M40 310L35 304M59 344L63 353M-662 1164L-660 1152M-657 1147L-653 1143M401 361L431 334M305 483L337 466M337 465L347 447M365 410L348 443M347 444L337 464M77 389L80 396M117 561L108 567M294 487L305 483M-385 904L-374 893M-137 769L-44 720M-148 774L-137 769M-141 770L-148 773M-118 758L-141 770M999 91L945 128L899 180M900 181L937 141L999 92M999 92L1020 81L1051 80M1051 79L1019 79L999 91M651 255L705 245L748 250M895 184L840 228L793 250L748 249M781 -313L834 -361M833 -361L779 -311M481 -13L505 -30M543 -56L505 -31M481 -13L460 6M681 -211L704 -232M680 -211L660 -191M660 -191L626 -135M660 -190L681 -211M270 225L272 217M898 -404L906 -409M861 -380L866 -385M930 -425L941 -431M34 394L23 382M1022 -520L1047 -545L1064 -582M1069 -588L1085 -606L1126 -627L1153 -652M49 346L56 343M73 336L91 329M3 366L15 375M-478 503L-567 556M-550 550L-477 504M211 762L208 756M210 762L221 783M80 396L83 405M250 506L261 501M261 501L280 493M246 506L208 525M193 534L201 529M66 362L70 371M167 187L161 191M221 783L229 800M223 151L231 146M243 138L254 133M271 124L275 119M309 78L315 72M357 63L369 63M381 67L371 63M371 63L362 63M316 70L308 77M277 113L270 123M70 371L67 364M82 402L79 393M423 48L419 53M351 60L339 56M325 62L320 66M222 151L216 155M1 696L-118 758M114 324L113 333M113 333L109 339M262 500L249 505M-25 380L-20 375M92 328L86 330M161 319L145 321M62 186L71 196M254 132L242 138M-117 173L-128 153M-2 128L3 143M25 170L21 165M9 151L23 168M9 150L3 143M232 244L225 243M270 239L270 225M-12 255L-8 260M282 198L275 211M326 141L336 137M-148 121L-126 158M-126 158L-123 165M219 777L211 762M-87 212L-70 227M149 624L157 640M385 107L414 63M381 113L385 107M193 727L203 748M173 681L181 700M110 257L112 270M443 323L454 313M204 748L201 742M422 341L384 375L366 407M208 756L210 762M386 374L400 362M386 105L380 114M380 114L375 118M-92 426L-117 439M137 589L133 570M-207 445L-250 426M-172 460L-180 456M121 561L130 554M21 -52L29 -50M-2 -76L0 -61L8 -54M530 269L552 260L608 266M509 280L530 269M471 298L425 338M493 287L471 298M-44 720L-22 709M-20 374L-28 380M97 82L106 96M532 267L493 287M575 261L550 259L532 267M-165 463L-136 451M79 644L88 634L95 608M97 598L99 585M95 608L97 598M7 693L1 696M-84 423L-73 417M-200 449L-190 453M-314 451L-299 445M-568 559L-554 553M-377 895L-386 904M716 -243L721 -254M721 -254L716 -244M-654 586L-661 589M-665 592L-655 589M-570 558L-585 564M-460 495L-438 488M-432 485L-478 503M-477 504L-463 496M-430 486L-413 482M-417 481L-431 485M-410 481L-388 476M-387 473L-410 479M-270 427L-316 451M-319 452L-324 455M-296 443L-289 440M-185 454L-201 447M-186 455L-170 462M-132 448L-118 441M-121 441L-133 448M-74 417L-86 423M-66 411L-72 415M-70 416L-64 410M-14 370L-20 374M146 322L159 320M145 321L136 323M136 323L130 323M111 276L110 285M101 243L108 255M108 253L104 247M120 215L114 218M61 420L56 416M49 408L56 416M19 379L26 385M-37 243L-15 253M45 182L53 183M44 182L32 178M-20 249L-26 246"
  },
  "pts": {
    "limoilou": [560.5, 289.4, 236.3, 221.9],
    "montcalm": [561.0, 317.3, 237.6, 301.1],
    "saint-roch": [565.6, 301.8, 250.7, 257.2],
    "saint-sauveur": [554.3, 309.0, 218.8, 277.5],
    "sainte-foy": [508.7, 348.7, 89.7, 389.9],
    "charlesbourg": [532.3, 250.0, 156.7, 110.5],
    "beauport": [591.7, 251.6, 324.5, 115.0],
    "lebourgneuf": [509.1, 279.6, 91.1, 194.2],
    "vieux-quebec": [580.7, 303.5, 293.6, 262.0],
    "la-haute-saint-charles": [449.5, 222.4],
    "l-ancienne-lorette": [462.4, 312.1],
    "saint-augustin-de-desmaures": [385.4, 383.9],
    "boischatel": [636.6, 209.0],
    "lac-beauport": [510.7, 154.7],
    "stoneham-et-tewkesbury": [453.8, 91.7],
    "sainte-brigitte-de-laval": [590.7, 88.4],
    "sainte-catherine-de-la-jacques-cartier": [261.9, 268.7],
    "shannon": [338.8, 220.6],
    "levis": [603.6, 315.6],
    "saint-henri": [690.3, 442.4],
    "saint-lambert-de-lauzon": [575.9, 562.7],
    "saint-apollinaire": [341.0, 533.8],
    "sainte-marie": [718.7, 718.1],
    "donnacona": [171.9, 460.2],
    "pont-rouge": [197.2, 368.9],
    "saint-raymond": [89.8, 217.7]
  },
  "cadre": [476.9, 211.0, 148.5, 159.7]
};
const VILLE_QC = ['limoilou', 'montcalm', 'saint-roch', 'saint-sauveur', 'sainte-foy', 'charlesbourg', 'beauport', 'lebourgneuf', 'vieux-quebec'];
function Couches({
  v,
  id
}) {
  return <React.Fragment>
  <rect width={v.W} height={v.H} fill="#F4F7FB" />
  <path d={v.eau} fill="#BFD5EE" fillRule="evenodd" stroke="#A9C6E8" strokeWidth=".8" />
  {v.riv.map(r => <path key={r.n} d={r.d} fill="none" stroke="#9DBDE4" strokeWidth={id === 'i' ? 1.8 : 1.2} strokeLinecap="round" strokeLinejoin="round" />)}
  <path d={v.aut} fill="none" stroke="#fff" strokeWidth={id === 'i' ? 4 : 3.2} strokeLinecap="round" strokeLinejoin="round" />
  <path d={v.aut} fill="none" stroke="#E2C58F" strokeWidth={id === 'i' ? 1.6 : 1.2} strokeLinecap="round" strokeLinejoin="round" opacity=".9" /></React.Fragment>;
}
function CarteRegion({
  L,
  act,
  setSel,
  aller,
  en
}) {
  const M = CARTE_QC.m,
    I = CARTE_QC.i,
    P = CARTE_QC.pts,
    [cx, cy, cw, ch] = CARTE_QC.cadre,
    dansVille = act && VILLE_QC.includes(act.s);
  const IW = 300,
    IH = Math.round(IW * I.H / I.W),
    IX = 14,
    IY = M.H - IH - 14;
  const pt = (q, x, y, petit) => {
    const on = L.includes(q),
      a = act && act.s === q.s;
    return <g key={q.s + (petit ? 'i' : 'm')} onClick={() => on ? setSel(q.s) : aller(q.s)} onDoubleClick={() => aller(q.s)} onMouseEnter={() => on && setSel(q.s)} style={{
      cursor: 'pointer'
    }}>
    {a && <circle className="sel-halo" cx={x} cy={y} r="15" fill="none" stroke="#4581CB" strokeWidth="2" />}
    <circle className="sel-pt" cx={x} cy={y} r={a ? 9 : on ? 6.5 : 4} fill={a ? '#0C2147' : on ? '#4581CB' : '#A7B9D0'} stroke="#fff" strokeWidth={on ? 2.5 : 1.5} />
    {(a || !petit && on && L.length <= 8) && <text x={x + 13} y={y + 4} fontSize={a ? 14 : 12} fontWeight={a ? 700 : 600} fill="#0C2147" style={{
        paintOrder: 'stroke'
      }} stroke="#F4F7FB" strokeWidth="4" strokeLinejoin="round">{q.n}</text>}</g>;
  };
  return <svg viewBox={'0 0 ' + M.W + ' ' + M.H} preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
    <Couches v={M} id="m" />
    <text x="300" y="455" fontSize="13" fontStyle="normal" fill="#5B86BB" letterSpacing="1.5" transform="rotate(-22 300 455)">{en ? 'St. Lawrence River' : 'Fleuve Saint-Laurent'}</text>
    <text x="728" y="182" fontSize="11" fill="#5B86BB" letterSpacing="1">{en ? 'Île d’Orléans' : 'Île d’Orléans'}</text>
    <text x="40" y="40" fontSize="11" fontWeight="700" letterSpacing="2.4" fill="#4581CB">{en ? 'NORTH SHORE' : 'RIVE-NORD'}</text>
    <text x="560" y="610" fontSize="11" fontWeight="700" letterSpacing="2.4" fill="#6B7A8F">{en ? 'SOUTH SHORE' : 'RIVE-SUD'}</text>
    <rect x={cx} y={cy} width={cw} height={ch} rx="6" fill={dansVille ? 'rgba(12,33,71,.08)' : 'rgba(69,129,203,.06)'} stroke={dansVille ? '#0C2147' : '#4581CB'} strokeWidth="1.6" strokeDasharray="5 4" />
    <path d={'M' + cx + ' ' + (cy + ch) + 'L' + (IX + IW) + ' ' + IY} stroke="#4581CB" strokeWidth="1" strokeDasharray="3 4" opacity=".7" />
    {QUARTIERS.filter(q => P[q.s] && !VILLE_QC.includes(q.s)).map(q => pt(q, P[q.s][0], P[q.s][1], false))}
    <defs><filter id="cq-om" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0C2147" floodOpacity=".22" /></filter></defs>
    <g transform={'translate(' + IX + ' ' + IY + ')'}>
      <rect x="-2" y="-2" width={IW + 4} height={IH + 4} rx="12" fill="#fff" stroke="#fff" strokeWidth="3" filter="url(#cq-om)" />
      <svg x="0" y="0" width={IW} height={IH} viewBox={'0 0 ' + I.W + ' ' + I.H} style={{
        overflow: 'hidden'
      }}><Couches v={I} id="i" />
        {QUARTIERS.filter(q => VILLE_QC.includes(q.s)).map(q => pt(q, P[q.s][2], P[q.s][3], true))}</svg>
      <rect x="10" y="10" width="124" height="24" rx="7" fill="#0C2147" /><text x="20" y="26" fontSize="11" fontWeight="700" fill="#fff" letterSpacing="1">{en ? 'QUÉBEC CITY' : 'VILLE DE QUÉBEC'}</text></g>
    <g transform={'translate(' + (M.W - 196) + ' ' + (M.H - 62) + ')'}><rect width="184" height="34" rx="9" fill="#fff" opacity=".92" /><path d="M12 17h22" stroke="#E2C58F" strokeWidth="3" strokeLinecap="round" /><text x="40" y="21" fontSize="11" fill="#3E4A59">{en ? 'Highway' : 'Autoroute'}</text><path d="M104 17h22" stroke="#9DBDE4" strokeWidth="2.4" strokeLinecap="round" /><text x="132" y="21" fontSize="11" fill="#3E4A59">{en ? 'River' : 'Rivière'}</text></g>
    <text x={M.W - 12} y={M.H - 12} textAnchor="end" fontSize="10" fill="#6B7A8F">© OpenStreetMap</text>
  </svg>;
}
const sansAccent = x => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function Selecteur() {
  const [z, setZ] = React.useState('Tous'),
    [t, setT] = React.useState(''),
    [sel, setSel] = React.useState(null),
    en = useEN();
  const zoneDe = q => q.zone || 'Ville de Québec';
  const L = QUARTIERS.filter(q => (z === 'Tous' || zoneDe(q) === z) && (!t || sansAccent(q.n + ' ' + q.arr).includes(sansAccent(t))));
  const act = sel && L.find(q => q.s === sel) || L[0];
  const aller = s => {
    window.location.hash = "/quartiers/" + s;
  };
  return <div className="sel-p"><style>{CSS_SEL}</style>
    <div style={{
      display: 'grid',
      gap: '14px',
      alignContent: 'start'
    }}>
      <label htmlFor="sel-q" style={{
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '.12em',
        textTransform: 'uppercase',
        color: 'var(--bleu-600)'
      }}>Trouver un secteur</label>
      <div style={{
        position: 'relative'
      }}><span aria-hidden="true" style={{
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'grid'
        }}><Icon name="search" size={18} color="var(--bleu-600)" /></span>
        <input id="sel-q" className="sel-in" type="search" autoComplete="off" placeholder="Rechercher un quartier ou une ville" value={t} onChange={e => {
          setT(e.target.value);
          setSel(null);
        }} /></div>
      <div className="sel-z" role="group" aria-label="Filtrer par zone">{ZTAB.map(([k, l]) => {
          const n = k === 'Tous' ? QUARTIERS.length : QUARTIERS.filter(q => zoneDe(q) === k).length;
          return <button key={k} type="button" className="sel-zb" aria-pressed={z === k} onClick={() => {
            setZ(k);
            setSel(null);
          }}>{l}<b>{n}</b></button>;
        })}</div>
      <p aria-live="polite" style={{
        margin: '2px 0 0',
        fontSize: '12px',
        color: 'var(--texte-discret)'
      }}><span>{L.length}</span> <span>{L.length > 1 ? 'guides' : 'guide'}</span></p>
      {L.length ? <ul className="sel-l">{L.map(q => <li key={q.s} className="sel-li"><a href={"/quartiers/" + q.s} data-actif={act && act.s === q.s ? 'true' : 'false'} onMouseEnter={() => setSel(q.s)} onFocus={() => setSel(q.s)}>
          <span style={{
              display: 'grid',
              gap: '2px',
              minWidth: 0
            }}><span style={{
                fontSize: '14.5px',
                fontWeight: 600,
                color: 'var(--marine-900)'
              }}>{q.n}</span><span style={{
                fontSize: '12px',
                color: 'var(--texte-discret)'
              }}>{q.arr}</span></span>
          <span className="sel-fl" aria-hidden="true"><Icon name="arrow-right" size={16} /></span></a></li>)}</ul> : <div style={{
        display: 'grid',
        gap: '10px',
        justifyItems: 'start',
        padding: '18px',
        borderRadius: '12px',
        background: '#F5F8FC'
      }}><span style={{
          fontSize: '14px',
          color: 'var(--texte-corps)'
        }}>Aucun secteur ne correspond à votre recherche.</span><button type="button" className="sel-zb" onClick={() => {
          setT('');
          setZ('Tous');
        }}>Tout afficher</button></div>}
    </div>
    <div className="sel-dr">
    <div className="sel-c">
      <CarteRegion L={L} act={act} setSel={setSel} aller={aller} en={en} /></div>
      {act && <div key={act.s} className="sel-det">
        <div style={{
          display: 'grid',
          gap: '6px',
          alignContent: 'start',
          minWidth: 0
        }}><Etq><span>{act.arrT || 'Arrondissement'}</span> · <span>{act.arr}</span></Etq><span style={{
            fontSize: 'clamp(22px,2.2vw,28px)',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
            color: 'var(--marine-900)'
          }}>{act.n}</span>
          <span style={{
            fontSize: '14px',
            lineHeight: 1.6,
            color: 'var(--texte-corps)'
          }}>{act.d}</span>
          <ul aria-label="Repères" style={{
            listStyle: 'none',
            margin: '4px 0 0',
            padding: 0,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px'
          }}>{act.rep.map(r => <li key={r} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              minHeight: '30px',
              padding: '0 10px',
              borderRadius: '8px',
              background: '#EEF4FB',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--marine-900)'
            }}><Icon name="map-pin" size={12} color="var(--bleu-600)" />{r}</li>)}</ul></div>
        <div className="sel-det-d">{act.chiffre && <div className="sel-ch"><Etq clair>{act.chiffre[0]}</Etq><span style={{
              fontSize: '30px',
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums'
            }}>{act.chiffre[1]}</span><span style={{
              fontSize: '12px',
              lineHeight: 1.45,
              color: 'var(--bleu-100)'
            }}>{act.chiffre[2]}</span></div>}
          <a href={"/quartiers/" + act.s} className="sel-go">Voir le guide<Icon name="arrow-right" size={16} color="#fff" /></a></div>
      </div>}
    </div></div>;
}
function PageQuartiers({
  route
}) {
  const [anim, setAnim] = React.useState(false);
  React.useEffect(() => {
    setAnim(true);
  }, []);
  return <div className={anim ? 'qx-anim' : ''}><style>{CSS_QX + CSS_QO + CSS_QA}</style>
    <PBHeros compact route={route} surtitre="Guides de quartier" titre="Quartiers de Québec : {où louer} votre prochain logement" lead="Quartiers et villes de la grande région de Québec : vie de quartier, histoire, repères et questions fréquentes. Nos logements à louer arrivent bientôt." />
    <Section fond="douce"><Selecteur /></Section>
    <AppelFinal surtitre="Logements à louer" titre="Nos logements arrivent {bientôt}." texte="Cléo peut vous avertir dès leur mise en ligne." bouton="En savoir plus" to="/logements-a-louer" />
  </div>;
}

/* ── Page de quartier (gabarit Mosaïque, voir QuartierM plus bas). ──
   Contenu : portrait, vie de quartier, histoire (Wikipédia, reformulée), dates clés, FAQ propre au quartier (route.faqTexte, aussi en FAQPage).
   Animation : apparition au défilement (IntersectionObserver), ligne du temps qui se trace; tout est désactivé si l'utilisateur réduit les animations. */
const CSS_QX = `
.qx-anim .qx-r{opacity:0;transform:translateY(18px);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1);transition-delay:var(--d,0ms)}
.qx-anim .vu .qx-r,.qx-anim .qx-r.vu{opacity:1;transform:none}
.qx-ligne{transform-origin:left;transform:scaleX(0);transition:transform 1.4s cubic-bezier(.2,.7,.2,1) .2s}.vu .qx-ligne{transform:scaleX(1)}
.qx-tuile{transition:transform .25s ease,box-shadow .25s ease,border-color .25s}.qx-tuile:hover{transform:translateY(-3px);box-shadow:0 14px 34px rgba(12,33,71,.10);border-color:rgba(69,129,203,.45)}
@media (prefers-reduced-motion:reduce){.qx-anim .qx-r{opacity:1;transform:none;transition:none}.qx-ligne{transform:none;transition:none}.qx-tuile,.qx-tuile:hover{transition:none;transform:none}}`;
/* Apparition : la classe « vu » est posée quand le bloc entre à l'écran. */
function useVuQ(seuil = .15) {
  const r = React.useRef(null),
    [vu, setVu] = React.useState(false);
  React.useEffect(() => {
    const el = r.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setVu(true);
      return;
    }
    const io = new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting)) {
        setVu(true);
        io.disconnect();
      }
    }, {
      threshold: seuil
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [r, vu];
}
const Bloc = ({
  as = 'div',
  className = '',
  children,
  style,
  id,
  lab
}) => {
  const [r, vu] = useVuQ();
  const T = as;
  return <T ref={r} id={id} aria-labelledby={lab} className={className + (vu ? ' vu' : '')} style={style}>{children}</T>;
};
const nomDe = q => q.de || (q.s === 'vieux-quebec' ? 'du Vieux-Québec' : (/^[AEIOUÉ]/.test(q.n) ? 'd’' : 'de ') + q.n);
const aDe = q => q.dans;
/* Libellé du guide selon le lieu : quartier, ville ou arrondissement. */
const GUIDE = {
  ville: ['Guide de ville', 'guide de la ville'],
  arrondissement: ['Guide d’arrondissement', 'guide de l’arrondissement']
};
const guideDe = q => GUIDE[q.type] || ['Guide de quartier', 'guide du quartier'];
const VIE = q => [['users', 'L’ambiance', q.vie], ['house', 'Les logements', q.log], ['map-pin', 'À proximité', q.pres.join(' · ')], ['lightbulb', 'Bon à savoir', q.sav]];
const H2Q = ({
  id,
  children,
  clair
}) => <h2 id={id} className="qx-r" style={{
  margin: 0,
  fontSize: 'var(--titre-l)',
  lineHeight: 1.2,
  letterSpacing: '-0.03em',
  color: clair ? '#fff' : 'var(--marine-900)',
  textWrap: 'balance'
}}>{children}</h2>;
const Sur = ({
  children,
  clair
}) => <span className="qx-r" style={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: clair ? 'var(--bleu-300)' : 'var(--bleu-600)'
}}>{children}</span>;

/* Mosaïque (maquette Penpot « Modèle 2 », retenue le 11 oct. 2026) : tuiles du quartier, ligne du temps avec cartes de dates, FAQ en cartes.
   Gabarit unique des pages de quartier et de ville. */
const CSS_QM = `
.qxm-g{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:16px}
.qxm-vie{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.qxm-dates{position:relative;list-style:none;margin:0;padding:34px 0 0;display:grid;gap:16px}
.qxm-tl{position:relative}
.qxm-tl>.qxm-pt.qxm-bout{top:0;left:auto;right:0}
.qxm-tl .qxm-pt.qxm-fin{background:var(--bleu-600);box-shadow:0 0 0 5px rgba(69,129,203,.18)}
.qxm-tl .qxm-pt{position:absolute;top:-34px;left:0;width:20px;height:20px;border-radius:50%;background:#fff;border:3px solid var(--bleu-600);box-sizing:border-box}
@media (max-width:960px){.qxm-g{grid-template-columns:minmax(0,1fr)}.qxm-vie{grid-template-columns:repeat(2,minmax(0,1fr))}.qxm-dates{grid-template-columns:repeat(3,minmax(0,1fr))!important;padding-top:0}.qxm-tl .qx-ligne,.qxm-tl .qxm-pt{display:none}}
@media (max-width:640px){.qxm-vie{grid-template-columns:minmax(0,1fr)}.qxm-cta{grid-template-columns:minmax(0,1fr)!important}
.qxm-dates{grid-template-columns:minmax(0,1fr)!important;gap:0!important;padding:4px 0 4px 26px!important}
.qxm-dates::before{content:"";position:absolute;left:8px;top:18px;bottom:18px;width:2px;border-radius:2px;background:linear-gradient(#4581CB,#C8DAF0)}
.qxm-dates>li{grid-template-columns:62px minmax(0,1fr)!important;align-items:baseline!important;gap:12px!important;padding:12px 4px!important;border:0!important;box-shadow:none!important;background:transparent!important;text-align:left!important}
.qxm-dates>li::before{content:"";position:absolute;left:-23px;top:19px;width:12px;height:12px;border-radius:50%;background:#fff;border:3px solid #4581CB;box-sizing:border-box}
.qxm-dates>li:last-child::before{background:#4581CB}
.qxm-dates>li>span:nth-of-type(2){font-size:22px!important}}`;
const CARTE = {
  borderRadius: '14px',
  background: '#fff',
  border: LIGNE
};
const Etq = ({
  children,
  clair
}) => <span style={{
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: clair ? 'var(--bleu-300)' : 'var(--bleu-600)'
}}>{children}</span>;
const useEN = () => !!(LL_LANGUE && LL_LANGUE.en);
const bouge = () => !((__ssr() ? "undefined" : typeof window) !== 'undefined' && ((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia : undefined) && ((__ssr() ? "undefined" : typeof window) !== "undefined" ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : undefined));
/* Profondeur : la carte s'incline légèrement vers le pointeur et un halo le suit (souris seulement). */
const incline = e => {
  if (e.pointerType !== 'mouse' || !bouge()) return;
  const el = e.currentTarget,
    r = el.getBoundingClientRect(),
    x = (e.clientX - r.left) / r.width,
    y = (e.clientY - r.top) / r.height;
  el.style.setProperty('--rx', ((.5 - y) * 5).toFixed(2) + 'deg');
  el.style.setProperty('--ry', ((x - .5) * 5).toFixed(2) + 'deg');
  el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
  el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
};
const repos = e => {
  const el = e.currentTarget;
  el.style.setProperty('--rx', '0deg');
  el.style.setProperty('--ry', '0deg');
};
const CSS_QO = `
.qxo{perspective:1400px}
.qx-anim .qxo .qx-r{transform:perspective(1200px) rotateX(9deg) translateY(30px);transform-origin:50% 100%}
.qx-anim .qxo.vu .qx-r{transform:none}
.qxo-c{position:relative;height:100%;box-sizing:border-box;border-radius:18px;transform:rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));transition:transform .45s cubic-bezier(.2,.7,.2,1),box-shadow .45s;box-shadow:0 1px 2px rgba(12,33,71,.05),0 24px 48px -16px rgba(12,33,71,.16)}
.qxo-c::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .35s;background:radial-gradient(420px circle at var(--mx,50%) var(--my,50%),rgba(69,129,203,.10),transparent 60%)}
.qxo-c.qxo-n::after{background:radial-gradient(380px circle at var(--mx,50%) var(--my,50%),rgba(255,255,255,.10),transparent 60%)}
.qxo-c:hover{box-shadow:0 2px 4px rgba(12,33,71,.06),0 34px 64px -18px rgba(12,33,71,.24)}.qxo-c:hover::after{opacity:1}
.qxo-rue{stroke-dasharray:320;stroke-dashoffset:320;transition:stroke-dashoffset 1.6s cubic-bezier(.2,.7,.2,1) var(--d,0ms)}.qxo.vu .qxo-rue{stroke-dashoffset:0}
.qxo-pt{transform-box:fill-box;transform-origin:center;animation:qxoPouls 2.6s ease-in-out infinite}
@keyframes qxoPouls{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.6);opacity:.45}}
.qxo-jauge{transform-origin:left;transform:scaleX(0);transition:transform 1.6s cubic-bezier(.2,.7,.2,1) .45s}.qxo.vu .qxo-jauge{transform:scaleX(1)}
@media (max-width:640px){.qxo-grille{display:none}}
@media (prefers-reduced-motion:reduce){.qx-anim .qxo .qx-r{transform:none}.qxo-c{transform:none;transition:none}.qxo-rue{stroke-dashoffset:0;transition:none}.qxo-pt{animation:none}.qxo-jauge{transform:scaleX(1);transition:none}}`;
/* Compteur : affiche la valeur publiée; à l'apparition, compte de 0 jusqu'à elle puis revient au texte exact. */
function Compteur({
  val,
  vu
}) {
  const en = useEN(),
    n = parseFloat(String(val).replace(',', '.')),
    [c, setC] = React.useState(null);
  React.useEffect(() => {
    if (!vu || isNaN(n) || !bouge()) return;
    let raf, t0;
    const f = t => {
      t0 = t0 || t;
      const k = Math.min(1, (t - t0) / 1500),
        e = 1 - Math.pow(1 - k, 3);
      setC(n * e);
      if (k < 1) raf = (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(f) : undefined;else setC(null);
    };
    raf = (__ssr() ? "undefined" : typeof window) !== "undefined" ? requestAnimationFrame(f) : undefined;
    return () => (__ssr() ? "undefined" : typeof window) !== "undefined" ? cancelAnimationFrame(raf) : undefined;
  }, [vu, n]);
  return c === null ? <span>{val}</span> : <span aria-hidden="true">{en ? c.toFixed(1) + '%' : c.toFixed(1).replace('.', ',') + ' %'}</span>;
}
/* Bloc d'ouverture de la mosaïque : portrait (grille de rues en filigrane), chiffre clé avec jauge, arrondissement. */
function CoupDoeil({
  q
}) {
  const [r, vu] = useVuQ(.2),
    pct = q.chiffre && /^\d+(,\d+)? %$/.test(q.chiffre[1]) ? parseFloat(q.chiffre[1].replace(',', '.')) : 0,
    [haut, ...reste] = (q.situe || '').split(', ');
  const RUES = [...Array(7)].map((_, k) => ['M' + (40 + k * 36) + ' 0V200', 'M20 ' + (18 + k * 28) + 'H300']);
  return <div ref={r} className={'qxo' + (vu ? ' vu' : '')} style={{
    display: 'grid',
    gap: '16px'
  }}><style>{CSS_QO}</style><Sur>{q.type === 'ville' ? 'La ville en un coup d’œil' : q.type === 'arrondissement' ? 'L’arrondissement en un coup d’œil' : 'Le quartier en un coup d’œil'}</Sur>
    <div className="qxm-g">
      <div className="qx-r" style={{
        '--d': '0ms'
      }}><div className="qxo-c" onPointerMove={incline} onPointerLeave={repos} style={{
          ...CARTE,
          borderRadius: '18px',
          overflow: 'hidden',
          display: 'grid',
          gap: '16px',
          alignContent: 'start',
          padding: 'clamp(24px,3.5vw,44px)'
        }}>
        <svg className="qxo-grille" aria-hidden="true" viewBox="0 0 300 200" width="300" height="200" style={{
            position: 'absolute',
            top: 0,
            right: 0,
            pointerEvents: 'none'
          }}>
          <defs><radialGradient id="qxo-f" cx="1" cy="0" r="1"><stop offset=".2" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient><mask id="qxo-m"><rect width="300" height="200" fill="url(#qxo-f)" /></mask></defs>
          <g mask="url(#qxo-m)" fill="none">{RUES.map(([v, h], k) => <React.Fragment key={k}><path className="qxo-rue" d={v} stroke="#C8DAF0" strokeWidth="1" style={{
                  '--d': k * 70 + 'ms'
                }} /><path className="qxo-rue" d={h} stroke="#C8DAF0" strokeWidth="1" style={{
                  '--d': 80 + k * 70 + 'ms'
                }} /></React.Fragment>)}
            <path className="qxo-rue" d="M10 170L300 30" stroke="#91B5E0" strokeWidth="2" style={{
                '--d': '500ms'
              }} /><circle className="qxo-pt" cx="148" cy="103" r="5" fill="#4581CB" /></g></svg>
        <span style={{
            position: 'relative'
          }}><Etq>Portrait</Etq></span><h2 style={{
            position: 'relative',
            margin: 0,
            fontSize: 'var(--titre-l)',
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            color: 'var(--marine-900)'
          }}>{q.type === 'ville' ? 'La ville aujourd’hui' : q.type === 'arrondissement' ? 'L’arrondissement aujourd’hui' : 'Le quartier aujourd’hui'}</h2>{q.portrait.map((p, k) => <p key={k} style={{
            position: 'relative',
            margin: 0,
            fontSize: '14px',
            lineHeight: 1.8,
            color: 'var(--texte-corps)'
          }}>{p}</p>)}</div></div>
      <div style={{
        display: 'grid',
        gap: '16px',
        alignContent: 'start'
      }}>
        {q.chiffre && <div className="qx-r" style={{
          '--d': '120ms'
        }}><div className="qxo-c qxo-n" onPointerMove={incline} onPointerLeave={repos} style={{
            overflow: 'hidden',
            display: 'grid',
            gap: '12px',
            padding: '30px',
            background: 'radial-gradient(120% 90% at 100% 0%,rgba(69,129,203,.55),rgba(69,129,203,0) 60%),linear-gradient(135deg,#173A6E,#0C2147)',
            color: '#fff',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.10),0 1px 2px rgba(12,33,71,.08),0 28px 56px -18px rgba(12,33,71,.45)'
          }}>
          <Etq clair>{q.chiffre[0]}</Etq><span style={{
              fontSize: 'clamp(44px,5.4vw,64px)',
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '-0.035em',
              fontVariantNumeric: 'tabular-nums'
            }}>{/%$/.test(q.chiffre[1]) ? <Compteur val={q.chiffre[1]} vu={vu} /> : q.chiffre[1]}</span>
          {pct > 0 && <span aria-hidden="true" style={{
              position: 'relative',
              display: 'block',
              height: '8px',
              borderRadius: '4px',
              background: 'rgba(255,255,255,.12)',
              overflow: 'hidden',
              marginTop: '6px'
            }}><span className="qxo-jauge" style={{
                position: 'absolute',
                inset: 0,
                width: pct + '%',
                borderRadius: '4px',
                background: 'linear-gradient(90deg,#6A9AD5,#C8DAF0)'
              }}></span></span>}
          <span style={{
              fontSize: '13px',
              lineHeight: 1.5,
              color: 'var(--bleu-100)'
            }}>{q.chiffre[2]}</span></div></div>}
        <div className="qx-r" style={{
          '--d': '220ms'
        }}><div className="qxo-c" onPointerMove={incline} onPointerLeave={repos} style={{
            ...CARTE,
            borderRadius: '18px',
            display: 'grid',
            gridTemplateColumns: '48px minmax(0,1fr)',
            gap: '14px 16px',
            alignItems: 'center',
            padding: '28px 30px'
          }}>
          <span aria-hidden="true" style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#EEF4FB',
              display: 'grid',
              placeItems: 'center'
            }}><Icon name="map-pin" size={22} color="var(--bleu-600)" /></span>
          <div style={{
              display: 'grid',
              gap: '4px'
            }}><Etq>{q.arrT || 'Arrondissement'}</Etq><span style={{
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--marine-900)'
              }}>{q.arr}</span></div>
          {q.situe && <div style={{
              gridColumn: '1/-1',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '10px'
            }}><span style={{
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: '30px',
                padding: '0 12px',
                borderRadius: '8px',
                background: '#EEF4FB',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--marine-900)'
              }}>{haut}</span>{reste.length > 0 && <span style={{
                fontSize: '13px',
                color: 'var(--texte-discret)'
              }}>{reste.join(', ')}</span>}</div>}</div></div></div></div></div>;
}
/* Récit historique en chapitres (12 oct. 2026) : chaque paragraphe devient une carte; la période vient des années citées dans le texte. */
const CSS_REC = `
.rec-g{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
.rec-c{position:relative;overflow:hidden;display:grid;gap:12px;align-content:start;padding:clamp(22px,2.6vw,32px) clamp(22px,2.6vw,32px) clamp(24px,2.8vw,34px);border-radius:18px;background:#fff;border:1px solid rgba(12,33,71,.10);box-shadow:0 2px 4px rgba(12,33,71,.04),0 24px 48px -26px rgba(12,33,71,.22);transition:transform .35s cubic-bezier(.2,.7,.2,1),box-shadow .35s}
.rec-c:hover{transform:translateY(-3px);box-shadow:0 2px 4px rgba(12,33,71,.05),0 34px 60px -28px rgba(12,33,71,.30)}
.rec-c::before{content:"";position:absolute;left:0;top:28px;width:4px;height:52px;border-radius:0 3px 3px 0;background:#4581CB}
.rec-c:first-child::before{background:#0C2147}
.rec-n{position:absolute;right:22px;top:6px;font-size:76px;font-weight:700;line-height:1;letter-spacing:-0.04em;color:#EEF4FB;pointer-events:none}
@media (max-width:760px){.rec-g{grid-template-columns:minmax(0,1fr)}.rec-n{font-size:60px}}
@media (prefers-reduced-motion:reduce){.rec-c,.rec-c:hover{transition:none;transform:none}}`;
const periode = p => {
  const a = (p.match(/\b(1[5-9]\d\d|20\d\d)\b/g) || []).map(Number);
  if (!a.length) return '';
  const m = Math.min(...a),
    M = Math.max(...a);
  return m === M ? String(m) : m + ' – ' + M;
};
function Recit({
  q
}) {
  return <React.Fragment><style>{CSS_REC}</style><div className="rec-g">{q.hist.map((p, k) => {
        const per = periode(p);
        return <article key={k} className="rec-c qx-r" style={{
          '--d': k * 90 + 'ms'
        }}>
  <span className="rec-n" aria-hidden="true">{pad2(k + 1)}</span>
  <span style={{
            position: 'relative',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: 'var(--bleu-600)'
          }}><span>Chapitre</span> {pad2(k + 1)}</span>
  {per && <span style={{
            position: 'relative',
            fontSize: 'clamp(22px,2.2vw,26px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            color: 'var(--marine-900)',
            fontVariantNumeric: 'tabular-nums'
          }}>{per}</span>}
  <p style={{
            position: 'relative',
            margin: 0,
            fontSize: '14px',
            lineHeight: 1.8,
            color: 'var(--texte-corps)'
          }}>{p}</p></article>;
      })}</div></React.Fragment>;
}
const pad2 = n => String(n).padStart(2, '0');
function QuartierM({
  q,
  route
}) {
  const F = route.faqTexte || [],
    nom = q.s === 'vieux-quebec' ? 'le Vieux-Québec' : q.n,
    boutons = [<Button key="a" variant="inverse" size="m" onClick={() => (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.dispatchEvent(new CustomEvent('ll-cleo', {
      detail: {
        texte: 'M’aviser des nouveautés'
      }
    })) : undefined} iconeAvant={<Icon name="bell" size={16} />}>M’aviser à l’ouverture</Button>, <Button key="b" as="a" href="/nous-joindre" variant="contour_inverse" size="m" iconeAvant={<Icon name="mail" size={16} />}>Écrire à l’équipe</Button>];
  return <React.Fragment><style>{CSS_QM}</style>
    <Section fond="douce"><div style={{
        display: 'grid',
        gap: 'clamp(56px,7vw,88px)'
      }}>
      <CoupDoeil q={q} />
      <Bloc style={{
          display: 'grid',
          gap: '20px'
        }}><h2 className="qx-r" style={{
            margin: 0,
            fontSize: '24px',
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
            color: 'var(--marine-900)'
          }}>{'La vie ' + aDe(q)}</h2>
        <div className="qxm-vie">{VIE(q).map(([ic, t, x], k) => <div key={t} className="qx-tuile qx-r" style={{
              '--d': k * 90 + 'ms',
              ...CARTE,
              display: 'grid',
              gap: '12px',
              alignContent: 'start',
              padding: '24px'
            }}><span aria-hidden="true" style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#EEF4FB',
                display: 'grid',
                placeItems: 'center'
              }}><Icon name={ic} size={20} color="var(--bleu-600)" /></span><h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--marine-900)'
              }}>{t}</h3><p style={{
                margin: 0,
                fontSize: '14px',
                lineHeight: 1.7,
                color: 'var(--texte-corps)'
              }}>{x}</p></div>)}</div>
        <div className="qxm-g">
          <div className="qx-r qxm-cta" style={{
              '--d': '120ms',
              position: 'relative',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) auto',
              gap: '24px',
              alignItems: 'center',
              padding: 'clamp(24px,3.5vw,40px)',
              borderRadius: '14px',
              background: 'linear-gradient(125deg,#3A72BA,#1F4A86)',
              color: '#fff'
            }}>
            <span aria-hidden="true" style={{
                position: 'absolute',
                right: '-80px',
                top: '-80px',
                width: '240px',
                height: '240px',
                borderRadius: '50%',
                background: 'radial-gradient(closest-side,rgba(255,255,255,.14),rgba(255,255,255,0))'
              }}></span>
            <div style={{
                position: 'relative',
                display: 'grid',
                gap: '10px'
              }}><Etq clair>Votre prochain logement</Etq><p style={{
                  margin: 0,
                  fontSize: 'clamp(22px,2.4vw,28px)',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  letterSpacing: '-0.03em'
                }}>{'Envie de vivre ' + aDe(q) + '?'}</p><p style={{
                  margin: 0,
                  fontSize: '14px',
                  lineHeight: 1.65,
                  color: '#E3EDF9'
                }}>Nos logements à louer arrivent bientôt sur le site. Cléo peut vous avertir dès leur mise en ligne.</p></div>
            <div style={{
                position: 'relative',
                display: 'grid',
                gap: '10px'
              }}>{boutons}</div></div>
          <div className="qx-r" style={{
              '--d': '200ms',
              ...CARTE,
              display: 'grid',
              gap: '14px',
              alignContent: 'start',
              padding: '28px'
            }}><Etq>Repères</Etq><ul style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'grid',
                gap: '12px'
              }}>{q.rep.map(r => <li key={r} style={{
                  display: 'grid',
                  gridTemplateColumns: '8px minmax(0,1fr)',
                  gap: '12px',
                  alignItems: 'baseline',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--marine-900)'
                }}><span aria-hidden="true" style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--bleu-600)',
                    transform: 'translateY(-1px)'
                  }}></span>{r}</li>)}</ul></div></div></Bloc>
      <Bloc as="section" lab="qxm-hist-t" style={{
          display: 'grid',
          gap: '28px'
        }}><div style={{
            display: 'grid',
            gap: '12px'
          }}><Sur>Histoire</Sur><H2Q id="qxm-hist-t">{'L’histoire ' + nomDe(q)}</H2Q></div>
        <div className="qxm-tl"><span aria-hidden="true" className="qx-ligne" style={{
              position: 'absolute',
              left: '10px',
              right: '10px',
              top: '9px',
              height: '2px',
              background: 'linear-gradient(90deg,var(--bleu-600),#91B5E0)'
            }}></span>
          <span aria-hidden="true" className="qxm-pt qxm-fin qxm-bout"></span>
        <ol aria-label="Dates clés" className="qxm-dates" style={{
              gridTemplateColumns: 'repeat(' + q.dates.length + ',minmax(0,1fr))'
            }}>
          {q.dates.map(([a, t], k) => <li key={a} className="qx-r" style={{
                '--d': 300 + k * 120 + 'ms',
                position: 'relative',
                ...CARTE,
                display: 'grid',
                gap: '8px',
                alignContent: 'start',
                padding: '20px 18px'
              }}><span aria-hidden="true" className="qxm-pt"></span><span style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  color: 'var(--bleu-600)',
                  fontVariantNumeric: 'tabular-nums'
                }}>{a}</span><span style={{
                  fontSize: '13px',
                  lineHeight: 1.5,
                  fontWeight: 600,
                  color: 'var(--marine-900)'
                }}>{t}</span></li>)}</ol></div>
        <Recit q={q} /></Bloc>
    </div></Section>
    {F.length > 0 && <Section><Bloc as="section" lab="qxm-faq-t" style={{
        display: 'grid',
        gap: '28px'
      }}><H2Q id="qxm-faq-t">{'Questions fréquentes sur ' + nom}</H2Q>
      <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
          gap: '16px'
        }}>{F.map(([qq, a], k) => <div key={qq} className="qx-r" style={{
            '--d': k * 90 + 'ms',
            ...CARTE,
            display: 'grid',
            gap: '14px',
            alignContent: 'start',
            padding: '26px'
          }}><span aria-hidden="true" style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'var(--marine-900)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontSize: '14px',
              fontWeight: 700
            }}>?</span><h3 style={{
              margin: 0,
              fontSize: '16px',
              lineHeight: 1.4,
              fontWeight: 700,
              color: 'var(--marine-900)'
            }}>{qq}</h3><p style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: 1.7,
              color: 'var(--texte-corps)'
            }}>{a}</p></div>)}</div></Bloc></Section>}
  </React.Fragment>;
}

/* Autres quartiers (mosaïque) : cartes avec motif de rues propre à chaque quartier, profondeur et inclinaison au survol. */
const CSS_QA = `
.qxa-g{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px;perspective:1400px}
.qx-anim .qxa-g .qx-r{transform:perspective(1200px) rotateX(10deg) translateY(34px);transform-origin:50% 100%}
.qx-anim .qxa-g.vu .qx-r{transform:none}
.qxa-c{position:relative;display:grid;grid-template-rows:auto 1fr;height:100%;box-sizing:border-box;border-radius:16px;overflow:hidden;background:#fff;border:1px solid rgba(12,33,71,.12);text-decoration:none;color:inherit;transform:rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg)) translateY(var(--ty,0px));transition:transform .45s cubic-bezier(.2,.7,.2,1),box-shadow .45s,border-color .3s;box-shadow:0 1px 2px rgba(12,33,71,.05),0 22px 44px -18px rgba(12,33,71,.16)}
.qxa-c:hover{--ty:-6px;border-color:rgba(69,129,203,.45);box-shadow:0 2px 4px rgba(12,33,71,.06),0 36px 64px -20px rgba(12,33,71,.30)}
.qxa-c:focus-visible{outline:2px solid var(--bleu-600);outline-offset:3px}
.qxa-v{position:relative;height:88px;overflow:hidden;background:linear-gradient(135deg,#EEF4FB,#DCE8F6)}
.qxa-v::before{content:"";position:absolute;inset:0;background:radial-gradient(140% 120% at 100% 0%,rgba(69,129,203,.55),transparent 60%),linear-gradient(135deg,#173A6E,#0C2147);opacity:0;transition:opacity .45s}
.qxa-c:hover .qxa-v::before{opacity:1}
.qxa-v svg{position:absolute;inset:0;width:100%;height:100%}
.qxa-rue{stroke:#C8DAF0;stroke-dasharray:160;stroke-dashoffset:160;transition:stroke-dashoffset 1.4s cubic-bezier(.2,.7,.2,1) var(--d,0ms),stroke .45s}
.qxa-g.vu .qxa-rue{stroke-dashoffset:0}.qxa-c:hover .qxa-rue{stroke:#2C4F86}
.qxa-pt{fill:#4581CB;stroke:#fff;stroke-width:3;transform-box:fill-box;transform-origin:center;transition:transform .45s cubic-bezier(.2,.7,.2,1)}.qxa-c:hover .qxa-pt{transform:scale(1.35)}
.qxa-fl{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;background:#EEF4FB;color:var(--marine-900);transition:background .3s,color .3s,transform .35s cubic-bezier(.2,.7,.2,1)}
.qxa-c:hover .qxa-fl{background:var(--marine-900);color:#fff;transform:translateX(3px)}
@media (max-width:960px){.qxa-g{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:560px){.qxa-g{grid-template-columns:minmax(0,1fr)}}
@media (prefers-reduced-motion:reduce){.qx-anim .qxa-g .qx-r{transform:none}.qxa-c,.qxa-c:hover{transform:none;transition:none}.qxa-rue{stroke-dashoffset:0;transition:none}.qxa-pt,.qxa-fl{transition:none}}`;
const ANGLES = [18, -12, 30, -24, 8, 40, -35, 0, 22];
/* Carte de lieu (motif de rues propre à chaque lieu), réutilisée par « Autres quartiers » et la page des guides. */
const CarteLieu = ({
  x,
  i
}) => {
  const a = ANGLES[QUARTIERS.indexOf(x) % ANGLES.length],
    dx = Math.tan(a * Math.PI / 180) * 88;
  return <div className="qx-r" style={{
    '--d': i * 70 + 'ms'
  }}><a href={"/quartiers/" + x.s} className="qxa-c" onPointerMove={incline} onPointerLeave={repos}>
    <div className="qxa-v" aria-hidden="true"><svg viewBox="0 0 300 88" preserveAspectRatio="xMidYMid slice">{[...Array(7)].map((_, k) => <path key={k} className="qxa-rue" d={'M' + (k * 52 - 40) + ' 88L' + (k * 52 - 40 + dx + 30) + ' 0'} strokeWidth="1" fill="none" style={{
            '--d': i * 70 + k * 60 + 'ms'
          }} />)}<circle className="qxa-pt" cx="252" cy="34" r="7" /></svg></div>
    <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) auto',
        gridTemplateRows: 'auto 1fr',
        gap: '6px 12px',
        alignItems: 'start',
        alignContent: 'start',
        padding: '18px 20px 20px'
      }}>
      <span style={{
          gridColumn: '1/-1',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          color: 'var(--bleu-600)'
        }}>{x.arr}</span>
      <div style={{
          display: 'grid',
          gap: '6px'
        }}><span style={{
            fontSize: '20px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--marine-900)'
          }}>{x.n}</span><span style={{
            fontSize: '13px',
            lineHeight: 1.5,
            color: 'var(--texte-discret)'
          }}>{x.rep.slice(0, 2).join(' · ')}</span></div>
      <span className="qxa-fl" aria-hidden="true" style={{
          alignSelf: 'end'
        }}><Icon name="arrow-right" size={16} /></span></div></a></div>;
};
const GrilleLieux = ({
  lieux
}) => {
  const [r, vu] = useVuQ(.1);
  return <div ref={r} className={'qxa-g' + (vu ? ' vu' : '')}>{lieux.map((x, i) => <CarteLieu key={x.s} x={x} i={i} />)}</div>;
};
function AutresM({
  q
}) {
  const autres = QUARTIERS.filter(x => x.s !== q.s).sort((a, b) => (a.zone === q.zone ? 0 : 1) - (b.zone === q.zone ? 0 : 1)).slice(0, 8);
  return <Section style={{
    background: 'linear-gradient(180deg,#fff,#EEF4FB)'
  }}><style>{CSS_QA}</style><TitreBloc surtitre="Autres secteurs" titre="Comparer avec {un autre secteur}." action={<Fleche to="/quartiers">Tous les guides</Fleche>} />
    <GrilleLieux lieux={autres} /></Section>;
}

/* Bientôt disponible (12 oct. 2026) : logements à louer et demande de location ne sont pas encore en ligne.
   Toute adresse qui y mène (menu, pied, fiches, boutons) informe le visiteur et lui offre d'être avisé. */
const CSS_BI = `
.bi-g{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:20px;align-items:stretch}
.bi-pt{position:relative;width:10px;height:10px;border-radius:50%;background:#4581CB;flex:none}
.bi-pt::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:2px solid rgba(69,129,203,.45)}
@media (prefers-reduced-motion:no-preference){.bi-pt::after{animation:bi-p 2s ease-out infinite}@keyframes bi-p{0%{transform:scale(.6);opacity:1}100%{transform:scale(1.8);opacity:0}}}
.bi-t{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
@media (max-width:960px){.bi-g,.bi-t{grid-template-columns:minmax(0,1fr)}}`;
const BIENTOT = {
  logements: {
    titre: 'Nos logements à louer arrivent {bientôt}',
    lead: 'Les logements gérés par Lease Lane seront bientôt affichés ici. Cléo peut vous avertir dès leur mise en ligne.',
    items: [['map-pin', 'Carte interactive', 'Tous nos logements sur une carte, avec des filtres par secteur, pièces, loyer et date.'], ['file-text', 'Fiches détaillées', 'Photos, superficie, inclusions et date de disponibilité de chaque logement.'], ['message-square', 'Visites avec Cléo', 'Une visite réservée en tout temps, sans attendre un rappel.']]
  },
  demande: {
    titre: 'La demande de location en ligne arrive {bientôt}',
    lead: 'Le formulaire de demande de location sera bientôt offert ici. Cléo peut vous avertir dès son ouverture.',
    items: [['file-text', 'Demande en ligne', 'Un formulaire clair, à remplir en quelques minutes.'], ['key-round', 'Un seul dossier', 'Vos renseignements une seule fois, pour le logement qui vous intéresse.'], ['bell', 'Suivi de votre demande', 'Une réponse à chaque étape, par courriel.']]
  }
};
function PageBientot({
  route,
  sujet
}) {
  const k = sujet || (route && route.page === 'formulaire' ? 'demande' : 'logements'),
    B = BIENTOT[k],
    [r, vu] = useVuQ(.1),
    [anim, setAnim] = React.useState(false);
  React.useEffect(() => {
    setAnim(true);
  }, []);
  return <div className={anim ? 'qx-anim' : ''}><style>{CSS_QX + CSS_QO + CSS_BI}</style>
    <PBHeros compact route={route} surtitre="Bientôt disponible" titre={B.titre} lead={B.lead} />
    <Section fond="douce"><div ref={r} className={'qxo' + (vu ? ' vu' : '')} style={{
        display: 'grid',
        gap: 'clamp(48px,6vw,72px)'
      }}>
      <div className="bi-g">
        <div className="qx-r"><div className="qxo-c" onPointerMove={incline} onPointerLeave={repos} style={{
              ...CARTE,
              borderRadius: '18px',
              display: 'grid',
              gap: '22px',
              alignContent: 'start',
              padding: 'clamp(24px,3.5vw,40px)'
            }}>
          <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                justifySelf: 'start',
                minHeight: '34px',
                padding: '0 14px 0 16px',
                borderRadius: '10px',
                background: '#EEF4FB',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--marine-900)'
              }}><span className="bi-pt" aria-hidden="true"></span>En préparation</span>
          <h2 style={{
                margin: 0,
                fontSize: 'var(--titre-l)',
                lineHeight: 1.2,
                letterSpacing: '-0.03em',
                color: 'var(--marine-900)'
              }}>Ce qui s’en vient</h2>
          <ul style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'grid',
                gap: 0
              }}>{B.items.map(([ic, t, x], i) => <li key={t} style={{
                  display: 'grid',
                  gridTemplateColumns: '44px minmax(0,1fr)',
                  gap: '16px',
                  padding: '18px 0',
                  borderTop: i ? '1px solid var(--bordure-fine)' : 0
                }}><span aria-hidden="true" style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: '#EEF4FB',
                    display: 'grid',
                    placeItems: 'center'
                  }}><Icon name={ic} size={20} color="var(--bleu-600)" /></span><span style={{
                    display: 'grid',
                    gap: '4px'
                  }}><strong style={{
                      fontSize: '16px',
                      color: 'var(--marine-900)'
                    }}>{t}</strong><span style={{
                      fontSize: '14px',
                      lineHeight: 1.65,
                      color: 'var(--texte-corps)'
                    }}>{x}</span></span></li>)}</ul></div></div>
        <div className="qx-r" style={{
            '--d': '120ms'
          }}><div className="qxo-c qxo-n" onPointerMove={incline} onPointerLeave={repos} style={{
              position: 'relative',
              overflow: 'hidden',
              display: 'grid',
              gap: '18px',
              alignContent: 'start',
              padding: 'clamp(24px,3.5vw,40px)',
              color: '#fff',
              background: 'radial-gradient(120% 90% at 100% 0%,rgba(69,129,203,.55),rgba(69,129,203,0) 60%),linear-gradient(135deg,#173A6E,#0C2147)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.10),0 1px 2px rgba(12,33,71,.08),0 28px 56px -18px rgba(12,33,71,.45)'
            }}>
          <Etq clair>Être avisé</Etq>
          <p style={{
                margin: 0,
                fontSize: 'clamp(22px,2.4vw,28px)',
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: '-0.03em'
              }}>Soyez parmi les premiers informés.</p>
          <p style={{
                margin: 0,
                fontSize: '14px',
                lineHeight: 1.65,
                color: 'var(--bleu-100)'
              }}>Laissez Cléo vous avertir dès l’ouverture. Une question d’ici là? L’équipe vous répond en semaine.</p>
          <div style={{
                display: 'grid',
                gap: '10px',
                marginTop: '6px'
              }}><Button variant="inverse" size="m" onClick={() => (__ssr() ? "undefined" : typeof window) !== "undefined" ? window.dispatchEvent(new CustomEvent('ll-cleo', {
                  detail: {
                    texte: 'M’aviser des nouveautés'
                  }
                })) : undefined} iconeAvant={<Icon name="bell" size={16} />}>M’aviser à l’ouverture</Button><Button as="a" href="/nous-joindre" variant="contour_inverse" size="m" iconeAvant={<Icon name="mail" size={16} />}>Écrire à l’équipe</Button></div></div></div></div>
      <div style={{
          display: 'grid',
          gap: '20px'
        }}><Sur>En attendant</Sur>
        <div className="bi-t">{[['map-pin', 'Guides de quartier', 'Où louer à Québec : vie de quartier, histoire et repères.', '/quartiers'], ['users', 'Service aux locataires', 'Demandes de travaux, urgences et réponses à vos questions.', '/locataires'], ['lightbulb', 'Foire aux questions', 'Les règles du bail au Québec, expliquées simplement.', '/faq']].map(([ic, t, x, to], i) => <div key={t} className="qx-r" style={{
              '--d': i * 90 + 'ms'
            }}><a href={to} className="qxa-c" onPointerMove={incline} onPointerLeave={repos} style={{
                gridTemplateRows: 'auto',
                padding: '24px',
                gap: '12px',
                alignContent: 'start'
              }}><span aria-hidden="true" style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: '#EEF4FB',
                  display: 'grid',
                  placeItems: 'center'
                }}><Icon name={ic} size={20} color="var(--bleu-600)" /></span><span style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}><strong style={{
                    fontSize: '17px',
                    color: 'var(--marine-900)'
                  }}>{t}</strong><span className="qxa-fl" aria-hidden="true"><Icon name="arrow-right" size={16} /></span></span><span style={{
                  fontSize: '14px',
                  lineHeight: 1.65,
                  color: 'var(--texte-corps)'
                }}>{x}</span></a></div>)}</div></div>
    </div></Section><style>{CSS_QA}</style>
  </div>;
}
function PageQuartier({
  route
}) {
  const q = quartierDe(route.path) || QUARTIERS[0],
    [anim, setAnim] = React.useState(false);
  React.useEffect(() => {
    setAnim(true);
  }, []);
  return <div className={anim ? 'qx-anim' : ''}><style>{CSS_QX}</style>
    <PBHeros compact route={route} surtitre={guideDe(q)[0] + ' · ' + q.arr} titre={'Appartement à louer ' + q.dans + ' : {' + guideDe(q)[1] + '}'} lead={q.d} />
    <QuartierM q={q} route={route} />
    <AutresM q={q} />
    <AppelFinal surtitre="Une visite?" titre="Cléo réserve votre visite {en tout temps}." texte="Une question sur un logement, une visite à planifier : écrivez-lui, il répond 24/7." bouton="Écrire à Cléo" to="#cleo" />
  </div>;
}

/* Glossaire : [mots du client, terme juridique ou du site, clé FAQ ou texte publié, page source]. */
const CLEO_DEPOT = 'Au Québec, seul le premier mois de loyer peut être exigé d’avance (C.c.Q., art. 1904). Dépôt de garantie, dépôt pour les clés, chèques postdatés imposés et frais de dossier sont interdits; une somme perçue ainsi est remboursable avec intérêts.';
const GLOSSAIRE = [['Régie du logement', 'Tribunal administratif du logement (TAL)', {
  f: 't1'
}, ['/faq', 'FAQ']], ['Augmentation de loyer', 'Avis de modification du bail, fixation de loyer', {
  f: 'l11',
  f2: 't2'
}, ['/blogue/hausse-de-loyer-2026', 'Hausse de loyer 2026']], ['Expulsion', 'Reprise, résiliation, éviction', {
  f: 't3',
  f2: 't5'
}, ['/faq', 'FAQ']], ['Loyer impayé, retard', 'Recouvrement, demande au TAL', {
  f: 't5'
}, ['/faq', 'FAQ']], ['Dépôt, dépôt de garantie', 'Interdit au Québec (art. 1904 C.c.Q.)', {
  t: CLEO_DEPOT
}, ['/cleo', 'Cléo']], ['Transférer mon bail, quitter, déménager', 'Cession de bail, sous-location, avis de départ', {
  f: 'l7',
  f2: 'l14'
}, ['/locataires', 'Service aux locataires']], ['Colocataire, conjoint', 'Ajout d’une personne au bail', {
  f: 'l8'
}, ['/locataires', 'Service aux locataires']], ['Fuite, dégât d’eau, toilette, chauffage', 'Demande de travaux, urgence', {
  f: 'l5',
  f2: 'l4'
}, ['/locataires#urgence', 'Urgence 24/7']], ['3 ½, 4 ½, appartement', 'Logement', {
  t: 'Au Québec, un logement se désigne souvent par son nombre de pièces, la salle de bain comptant pour une demie : un 4 ½ compte quatre pièces et une salle de bain.',
  nouveau: 1
}, ['/quartiers', 'Quartiers de Québec']], ['Soumission, prix, tarif', 'Offre de service', {
  f: 'p1'
}, ['/offre-de-service', 'Offre de service']]];
function PageGlossaire({
  route
}) {
  const F = LL_FAQ,
    txt = x => x.t || [x.f, x.f2].filter(Boolean).map(k => F[k] && F[k].r).join(' ');
  return <div>
    <PBHeros compact route={route} surtitre="Glossaire" titre="Glossaire du {bail résidentiel} au Québec" lead="Les mots que vous employez, puis le terme du Code civil ou du TAL. Information juridique générale, pas un avis juridique." />
    <Section>
      <span className="ll-note-interne">À valider par Lease Lane avant publication (page non indexée). Chaque définition reprend mot pour mot une réponse déjà publiée sur le site, sauf « 3 ½, 4 ½ » (définition générale, nouvelle).</span>
      <dl style={{
        margin: 0,
        display: 'grid',
        border: LIGNE,
        borderRadius: '20px',
        overflow: 'hidden',
        background: '#fff'
      }}>
        {GLOSSAIRE.map(([mot, terme, def, [to, src]], k) => <div key={mot} className="ll-deux" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)',
          gap: '12px 40px',
          padding: '24px clamp(20px,3vw,32px)',
          borderTop: k ? '1px solid var(--bordure-fine)' : 0
        }}>
          <dt style={{
            display: 'grid',
            gap: '6px',
            alignContent: 'start'
          }}><span style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--marine-900)'
            }}>{'« ' + mot + ' »'}</span><span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--bleu-600)'
            }}>{terme}</span></dt>
          <dd style={{
            margin: 0,
            display: 'grid',
            gap: '10px',
            fontSize: '14px',
            lineHeight: 1.65,
            color: 'var(--texte-corps)'
          }}><span>{gab(txt(def))}</span><Fleche to={to}>{'Source : ' + src}</Fleche></dd></div>)}
      </dl>
    </Section>
    <AppelFinal surtitre="Votre situation" titre="Une question précise? {Cléo répond}." texte="Il vous donne la règle et sa source, les options de chaque partie et les délais, puis passe la main à une personne au besoin." bouton="Écrire à Cléo" to="#cleo" />
  </div>;
}
export { PageBientot, PageQuartiers, PageQuartier, PageGlossaire, BandeQuartiers, QUARTIERS as LL_QUARTIERS };
