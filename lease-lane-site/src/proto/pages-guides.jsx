/** @jsxImportSource @/lib/i18n */
'use client';

/* Converti depuis ui_kits/site-public/pages-guides.jsx (prototype) — ne pas réintroduire de globaux window. */
import React from 'react';
import { Icon, Button } from '@/components/ds';
import { Section } from '@/proto/accueil';
import { TitreBloc, Fleche, AppelFinal, gab } from '@/proto/blocs';
import { LL_ROUTES } from '@/proto/routes';
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
  chiffre: ['Locataires', '76,9 %', 'des habitants étaient locataires au recensement de 2016'],
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
  chiffre: ['Locataires', '77,6 %', 'des habitants étaient locataires au recensement de 2016'],
  n: 'Saint-Sauveur',
  dans: 'à Saint-Sauveur',
  arr: 'La Cité-Limoilou',
  d: 'Dans la basse-ville, à l’ouest de Saint-Roch. La rue Saint-Vallier Ouest le traverse.',
  rep: ['Rue Saint-Vallier Ouest', 'Boulevard Charest', 'Parc Victoria'],
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
  chiffre: ['Locataires', '46,1 %', 'des ménages de l’arrondissement Sainte-Foy–Sillery–Cap-Rouge étaient locataires en 2021'],
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
  chiffre: ['Locataires', '39,4 %', 'des ménages de l’arrondissement étaient locataires au recensement de 2021'],
  n: 'Charlesbourg',
  dans: 'à Charlesbourg',
  arr: 'Charlesbourg',
  d: 'Au nord de la ville. Son cœur historique, le Trait-Carré, conserve le tracé en étoile du XVIIe siècle.',
  rep: ['Trait-Carré', 'Boulevard Henri-Bourassa', 'Parc des Moulins'],
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
  chiffre: ['Locataires', '38,8 %', 'des ménages de l’arrondissement étaient locataires au recensement de 2021'],
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
  chiffre: ['Locataires', '34,2 %', 'des habitants de Neufchâtel-Est–Lebourgneuf étaient locataires en 2016'],
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
  chiffre: ['Locataires', '61,4 %', 'des habitants de Vieux-Québec–Cap-Blanc–colline Parlementaire étaient locataires en 2016'],
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
  chiffre: ["Locataires", "26,7 %", "des ménages de l’arrondissement étaient locataires au recensement de 2021"],
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
  chiffre: ["Locataires", "28,2 %", "des ménages étaient locataires au recensement de 2021"],
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
  chiffre: ["Locataires", "18,5 %", "des ménages étaient locataires au recensement de 2021"],
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
  chiffre: ["Locataires", "10,2 %", "des ménages étaient locataires au recensement de 2021"],
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
  chiffre: ["Locataires", "9,4 %", "des ménages étaient locataires au recensement de 2021"],
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
  chiffre: ["Locataires", "11,3 %", "des ménages étaient locataires au recensement de 2021"],
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
  chiffre: ["Locataires", "7,2 %", "des ménages étaient locataires au recensement de 2021"],
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
  chiffre: ["Locataires", "15,0 %", "des ménages étaient locataires au recensement de 2021"],
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
  chiffre: ["Locataires", "26,6 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Rivière Jacques-Cartier", "Rivière aux Pins", "Parc municipal de Shannon"],
  vie: "Une ville résidentielle en banlieue de Québec, traversée par la rivière Jacques-Cartier et la rivière aux Pins. Son nom rappelle les origines irlandaises de sa population.",
  log: "Un milieu résidentiel qui s’est beaucoup développé ces dernières années : la population est passée de 3 825 habitants en 2006 à 6 432 en 2021.",
  pres: ["Base des Forces canadiennes Valcartier", "Sainte-Catherine-de-la-Jacques-Cartier", "Zec de la Rivière-Jacques-Cartier"],
  sav: "Shannon est à environ 25 km du centre de Québec. La route 369 la relie à Sainte-Catherine-de-la-Jacques-Cartier.",
  hist: ["Le territoire de Shannon faisait autrefois partie de Sainte-Catherine, où des immigrants irlandais s’installent à partir de 1820 à l’invitation du seigneur Michel-Louis Juchereau Duchesnay. Le nom de la ville rappelle cette origine irlandaise. Pendant longtemps, la coupe du bois destiné aux chantiers navals de Québec fait vivre la population.", "En 1912, le ministère de la Milice acquiert des terres à Sainte-Catherine de Portneuf et à Saint-Gabriel-de-Valcartier pour y créer le camp militaire de Valcartier. Des cultivateurs, pour la plupart d’ascendance irlandaise, doivent alors quitter les terres que leurs ancêtres avaient défrichées.", "Le 14 décembre 1946, une partie de Sainte-Catherine de Portneuf s’en détache pour former la municipalité de Shannon. Les résidents du secteur contestaient les taxes municipales et le manque de services. En 1964, une deuxième expropriation fédérale agrandit la base militaire et Shannon perd les concessions 7 à 12.", "Le 20 mai 2017, la municipalité de Shannon change son statut pour celui de ville. Au recensement de 2021, elle compte 6 432 habitants, sur un territoire voisin de la base des Forces canadiennes Valcartier."],
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
  chiffre: ["Locataires", "34,1 %", "des ménages étaient locataires au recensement de 2021"],
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
  chiffre: ["Locataires", "26,3 %", "des ménages étaient locataires au recensement de 2021"],
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
  chiffre: ["Locataires", "11,6 %", "des ménages étaient locataires au recensement de 2021"],
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
  chiffre: ["Locataires", "22,1 %", "des ménages étaient locataires au recensement de 2021"],
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
  chiffre: ["Locataires", "29,5 %", "des ménages étaient locataires au recensement de 2021"],
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
  chiffre: ["Locataires", "34,8 %", "des ménages étaient locataires au recensement de 2021"],
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
  chiffre: ["Locataires", "22,4 %", "des ménages étaient locataires au recensement de 2021"],
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
  chiffre: ["Locataires", "20,4 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Vallée Bras-du-Nord", "Lac Sept-Îles", "Piste cyclable Jacques-Cartier–Portneuf"],
  vie: "Une petite capitale régionale entourée de forêts, de lacs et de rivières, très appréciée pour le plein air.",
  log: "Des maisons unifamiliales au centre et dans les quartiers résidentiels, des résidences au bord des lacs et quelques immeubles à logements près du centre.",
  pres: ["Centre multifonctionnel Rolland-Dion", "Rivière Sainte-Anne", "Réserve faunique des Laurentides"],
  sav: "Le territoire couvre 693,6 km² et plusieurs secteurs sont loin du centre. La voiture est presque indispensable, surtout l’hiver.",
  hist: ["Aux XVIIe et XVIIIe siècles, après leur défaite contre les Iroquois, des Wendats s’installent dans la seigneurie de Bourg-Louis et les cantons voisins. Ils y chassent, y pêchent et y cueillent des petits fruits.", "Des colons venus de L’Ancienne-Lorette s’établissent sur le territoire dès 1830. La paroisse catholique de Saint-Raymond-Nonnat est fondée vers 1842. Son nom honore Raymond Nonnat, un cardinal catalan. La paroisse civile est érigée en 1845.", "En 1898, le village se détache de la municipalité de paroisse. En 1905, le hameau de Chute-Panet se forme autour des installations de la Compagnie de papier Saint-Raymond. En 1958, la paroisse abandonne la particule « Nonnat » de son nom.", "Le 29 mars 1995, le village et la paroisse se réunissent pour former la ville de Saint-Raymond. L’ancienne voie ferrée qui menait vers Rivière-à-Pierre et le lac Saint-Jean est devenue une piste cyclable. Le bois et le cuir restent au cœur de l’économie locale."],
  portrait: ["Saint-Raymond s’étend de part et d’autre de la rivière Sainte-Anne, au cœur de la MRC de Portneuf. Le noyau urbain, au creux de la vallée, compte environ 3 000 habitants. Le reste de la population vit dans des hameaux comme Bourg-Louis et Chute-Panet, des quartiers résidentiels et des secteurs de villégiature autour des lacs.", "Au recensement de 2021, la ville comptait 11 108 habitants sur 693,6 km². Le Centre multifonctionnel Rolland-Dion, avec ses six salles, accueille spectacles et artistes. Chaque juillet, le Festival forestier de Saint-Raymond anime la ville."],
  dates: [["1830", "Arrivée de colons de L’Ancienne-Lorette"], ["1842", "Fondation de la paroisse Saint-Raymond-Nonnat"], ["1898", "Création du village de Saint-Raymond"], ["1905", "Naissance du hameau de Chute-Panet"], ["1995", "Réunion du village et de la paroisse"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Raymond"
}, {
  s: "la-cite-limoilou",
  n: "La Cité-Limoilou",
  dans: "dans La Cité-Limoilou",
  de: "de La Cité-Limoilou",
  type: "arrondissement",
  arrT: "Arrondissement",
  arr: "La Cité-Limoilou",
  zone: "Ville de Québec",
  d: "Au sud-est de la ville de Québec, le long du fleuve Saint-Laurent et de la rivière Saint-Charles. L’arrondissement réunit la haute-ville, la basse-ville et Limoilou, au nord de la rivière.",
  situe: "Centre-ville, entre le fleuve et la rivière Saint-Charles",
  chiffre: ["Locataires", "73,6 %", "des ménages de l’arrondissement étaient locataires au recensement de 2021"],
  rep: ["Vieux-Québec", "Rue Saint-Joseph", "3e Avenue"],
  vie: "La partie la plus ancienne et la plus dense de Québec. La haute-ville concentre les institutions politiques et culturelles, alors que la basse-ville et Limoilou sont surtout résidentielles, avec quelques secteurs industriels.",
  log: "Surtout des plex et des maisons en rangée, souvent desservis par des ruelles dans Limoilou. À Saint-Roch, d’anciens bâtiments industriels ont été convertis en copropriétés dans les années 2000.",
  pres: ["Plaines d’Abraham", "Domaine de Maizerets", "Parc linéaire de la rivière Saint-Charles"],
  sav: "Les locataires sont majoritaires dans plusieurs quartiers : en 2016, environ 76 % des habitants de Saint-Roch et du Vieux-Limoilou louaient leur logement. Le transport en commun est assuré par le Réseau de transport de la Capitale.",
  hist: ["Jacques Cartier découvre le site en 1535. C’est alors celui de Stadaconé, un village iroquoien. Samuel de Champlain fonde Québec en 1608, dans l’actuel Vieux-Québec, et la ville se développe d’abord dans ses fortifications, au sommet et au pied du cap Diamant.", "Au milieu du XVIIIe siècle, un premier faubourg, futur Saint-Roch, loge les artisans et les ouvriers hors des murs. Le faubourg Saint-Jean s’urbanise à partir des années 1780, et les deux sont intégrés à la ville en 1792. Au XIXe siècle, des incendies, dont ceux de 1845 et de 1866, rasent des faubourgs qui sont ensuite reconstruits.", "Limoilou reste rural jusqu’à la fin du XIXe siècle. En 1893, les villages ouvriers de Stadacona, Hedleyville et New Waterford s’unissent sous le nom de Limoilou, une variante de celui du manoir de Jacques Cartier à Saint-Malo. Annexé à Québec en 1909, le secteur s’urbanise selon un plan en quadrillé, avec ses rues numérotées et ses ruelles.", "Jusqu’aux années 1960, Saint-Roch est le centre-ville commerçant de Québec, avec les grands magasins de la rue Saint-Joseph. L’essor des banlieues entraîne ensuite de grands chantiers, comme l’autoroute Dufferin-Montmorency. Les arrondissements de La Cité et de Limoilou, créés le 1er janvier 2002, sont regroupés le 1er novembre 2009."],
  portrait: ["La Cité-Limoilou est le plus petit des six arrondissements de la ville de Québec, avec 22,18 km². La rivière Saint-Charles sépare La Cité, au sud, de Limoilou, au nord. Une falaise marque la limite entre la haute-ville, à plus de 100 m d’altitude, et la basse-ville. L’arrondissement compte neuf quartiers : Vieux-Québec–Cap-Blanc–colline Parlementaire, Saint-Roch, Saint-Jean-Baptiste, Montcalm, Saint-Sauveur, Saint-Sacrement, Lairet, Maizerets et Vieux-Limoilou.", "En 2021, l’arrondissement comptait 108 415 habitants. Avec environ 4 864 habitants par km², c’est le secteur le plus dense de la ville. Le Vieux-Québec, où Champlain fonde Québec en 1608, est inscrit au patrimoine mondial de l’UNESCO depuis 1985, et les plaines d’Abraham, le domaine de Maizerets et le parc linéaire de la rivière Saint-Charles sont les principaux espaces verts de l’arrondissement."],
  dates: [["1608", "Fondation de Québec par Champlain"], ["1792", "Les faubourgs intégrés à la ville"], ["1909", "Annexion de Limoilou à Québec"], ["1985", "Vieux-Québec inscrit à l’UNESCO"], ["2009", "Création de l’arrondissement actuel"]],
  wiki: "https://fr.wikipedia.org/wiki/La_Cité-Limoilou"
}, {
  s: "les-rivieres",
  n: "Les Rivières",
  dans: "dans Les Rivières",
  de: "des Rivières",
  type: "arrondissement",
  arrT: "Arrondissement",
  arr: "Les Rivières",
  zone: "Ville de Québec",
  d: "Au centre géographique de la ville de Québec, de part et d’autre de la rivière Saint-Charles. Le boulevard Wilfrid-Hamel le traverse d’est en ouest, et plusieurs autoroutes s’y croisent, dont Félix-Leclerc, Laurentienne et Robert-Bourassa.",
  situe: "Centre de Québec, le long de la rivière Saint-Charles",
  chiffre: ["Locataires", "51,4 %", "des ménages de l’arrondissement étaient locataires au recensement de 2021"],
  rep: ["Boulevard Wilfrid-Hamel", "Galeries de la Capitale", "Fleur de Lys centre commercial"],
  vie: "Un arrondissement où les quartiers résidentiels côtoient de grands centres commerciaux et des parcs industriels. La rivière Saint-Charles et ses parcs riverains le traversent.",
  log: "Beaucoup de logements locatifs à Vanier, des quartiers de maisons bâtis surtout après la Seconde Guerre mondiale à Duberger et aux Saules, et des maisons unifamiliales et des copropriétés à Lebourgneuf.",
  pres: ["Parc Chauveau", "Corridor des Cheminots", "Parc de l’Escarpement"],
  sav: "En 2016, 70,6 % des habitants de Vanier étaient locataires. Quatre autoroutes passent près de Duberger–Les Saules, où se trouve le terminus Les Saules du Réseau de transport de la Capitale.",
  hist: ["Le territoire reste longtemps agricole. La paroisse Saint-Ambroise-de-la-Jeune-Lorette, fondée en 1795, lance la colonisation du futur Neufchâtel. Plus au sud, La Petite-Rivière fait partie de Saint-Roch-de-Québec à sa création en 1855, puis devient une municipalité en 1902.", "Le 9 mars 1916, Québec-Ouest se détache de La Petite-Rivière. Des compagnies foncières veulent y bâtir un secteur résidentiel pour les travailleurs de Québec. Pendant la Crise, les maisons à bas prix attirent des familles, et la population passe de 600 à 2 132 habitants entre 1928 et 1933.", "Après la Seconde Guerre mondiale, industries et résidences se multiplient. La Petite-Rivière devient Duberger en 1964, et Québec-Ouest prend le nom de Vanier en 1966, en l’honneur du gouverneur général Georges Vanier. Entre 1970 et 1973, Québec annexe Duberger, Les Saules, Neufchâtel et Charlesbourg-Ouest.", "En 1988, Charlesbourg-Ouest prend le nom de Lebourgneuf, formé de la fin de Charlesbourg et du début de Neufchâtel. L’arrondissement est créé le 1er janvier 2002, lors des fusions municipales. Il réunit l’ancien secteur des Rivières et la ville de Vanier."],
  portrait: ["Les Rivières est l’un des six arrondissements de la ville de Québec, et il en occupe le centre géographique. Son nom vient de la rivière Saint-Charles, qui le traverse, et de deux de ses affluents, la rivière du Berger et la rivière Lorette. Il compte trois quartiers : Vanier, Duberger–Les Saules et Neufchâtel-Est–Lebourgneuf.", "En 2021, l’arrondissement comptait environ 77 000 habitants sur 48,61 km². On y trouve les Galeries de la Capitale, ouvertes en 1981, et le centre commercial Fleur de Lys, ouvert en 1963. Avec ses 146 hectares le long de la rivière Saint-Charles, le parc Chauveau est l’un des plus grands espaces verts de la ville."],
  dates: [["1916", "Fondation de Québec-Ouest, future Vanier"], ["1963", "Ouverture de Place Fleur de Lys"], ["1970", "Annexion de Duberger et des Saules"], ["1981", "Ouverture des Galeries de la Capitale"], ["2002", "Création de l’arrondissement"]],
  wiki: "https://fr.wikipedia.org/wiki/Les_Rivières_(Québec)"
}, {
  s: "sainte-foysillerycap-rouge",
  n: "Sainte-Foy–Sillery–Cap-Rouge",
  dans: "dans Sainte-Foy–Sillery–Cap-Rouge",
  de: "de Sainte-Foy–Sillery–Cap-Rouge",
  type: "arrondissement",
  arrT: "Arrondissement",
  arr: "Sainte-Foy–Sillery–Cap-Rouge",
  zone: "Ville de Québec",
  d: "Au sud-ouest de la ville de Québec, sur la colline de Québec et en bordure du fleuve. Les ponts de Québec et Pierre-Laporte y aboutissent, et le boulevard Laurier relie l’arrondissement au centre-ville.",
  situe: "Sud-ouest de Québec, en bordure du fleuve",
  chiffre: ["Locataires", "46,1 %", "des ménages de l’arrondissement étaient locataires au recensement de 2021"],
  rep: ["Boulevard Laurier", "Université Laval", "Promenade Samuel-De Champlain"],
  vie: "Sainte-Foy vit au rythme de l’Université Laval et des centres commerciaux du boulevard Laurier. Sillery, verdoyant, et Cap-Rouge, dans la vallée de la rivière du Cap Rouge, sont surtout résidentiels.",
  log: "Des maisons unifamiliales et de nombreux immeubles d’appartements, apparus à Sainte-Foy à partir des années 1960. Sillery mêle grandes propriétés et logements plus modestes, et Cap-Rouge compte surtout des propriétaires.",
  pres: ["Laurier Québec", "Parc du Bois-de-Coulonge", "Tracel de Cap-Rouge"],
  sav: "Les ponts de Québec et Pierre-Laporte relient l’arrondissement à Lévis, sur la rive sud. L’aéroport international Jean-Lesage se trouve dans le quartier de l’Aéroport, et le transport en commun est assuré par le Réseau de transport de la Capitale.",
  hist: ["En 1541, Jacques Cartier s’installe à Cap-Rouge avec 375 colons et fonde la colonie de Charlesbourg-Royal. Roberval prend la relève l’année suivante, mais le site est abandonné en 1543. Le nom Cap-Rouge vient du schiste rougeâtre des falaises, à l’embouchure de la rivière du Cap Rouge.", "En 1637, les Jésuites établissent une mission à Sillery, grâce au soutien de Noël Brûlart de Sillery. La mission Notre-Dame-de-Foy dessert dès 1638 les colons de l’ouest de la colline, et la seigneurie de Sillery est créée en 1651. Le 28 avril 1760, le chevalier de Lévis l’emporte sur les troupes de James Murray à Sainte-Foy.", "Au XIXe siècle, les anses de Sillery vivent du commerce du bois et de la construction navale, et des notables y bâtissent des villas. Sainte-Foy (1855), Saint-Colomb de Sillery (1856) et Saint-Félix-du-Cap-Rouge (1872) deviennent des municipalités. Le tracel de Cap-Rouge est achevé en 1908, et le pont de Québec relie Sainte-Foy à la rive sud en 1917.", "Sainte-Foy devient une ville en 1949, l’année où commence le campus de l’Université Laval et où s’ouvre le boulevard Laurier. Les trois villes sont fusionnées à Québec le 1er janvier 2002. L’arrondissement actuel naît le 1er novembre 2009, quand Cap-Rouge et l’Aéroport s’ajoutent à l’ancien arrondissement Sainte-Foy–Sillery."],
  portrait: ["Sainte-Foy–Sillery–Cap-Rouge est l’un des six arrondissements de la ville de Québec. Il est bordé au sud par le fleuve et à l’ouest par Saint-Augustin-de-Desmaures. Son nom réunit ceux des trois anciennes villes qui le composent, et il compte sept quartiers : Cité-Universitaire, Sillery, Saint-Louis, Plateau, Pointe-de-Sainte-Foy, l’Aéroport et Cap-Rouge.", "En 2021, l’arrondissement comptait environ 111 300 habitants sur 95,01 km². On y trouve l’Université Laval, l’aéroport international Jean-Lesage et Laurier Québec, ouvert en 1961, qui a été le premier centre commercial couvert de la province."],
  dates: [["1541", "Cartier fonde Charlesbourg-Royal"], ["1637", "Mission jésuite de Sillery"], ["1760", "Bataille de Sainte-Foy"], ["1949", "Début du campus de l’Université Laval"], ["2009", "Création de l’arrondissement actuel"]],
  wiki: "https://fr.wikipedia.org/wiki/Sainte-Foy–Sillery–Cap-Rouge"
}, {
  s: "wendake",
  n: "Wendake",
  dans: "à Wendake",
  de: "de Wendake",
  type: "ville",
  arrT: "Communauté",
  arr: "Nation huronne-wendat",
  zone: "Rive-Nord",
  d: "Dans le nord de la ville de Québec, entourée par les secteurs de Loretteville, Lac-Saint-Charles et Saint-Émile. La rivière Saint-Charles, appelée Akiawenrahk en wendat, borde le territoire.",
  situe: "Rive-Nord, enclavée dans la ville de Québec",
  chiffre: ["Locataires", "30,9 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Vieux-Wendake", "Église Notre-Dame-de-Lorette", "Hôtel-Musée Premières Nations"],
  vie: "Le chef-lieu de la Nation huronne-wendat, où la culture wendat est bien vivante. Le Vieux-Wendake réunit des maisons anciennes, des boutiques d’artisanat et des restaurants.",
  log: "Des maisons anciennes et des immeubles d’habitation dans le Vieux-Wendake, et des bungalows des années 1970 et des maisons récentes dans la partie nord.",
  pres: ["Chute Kabir Kouba", "Parc linéaire de la rivière Saint-Charles", "Maison Tsawenhohi"],
  sav: "Le logement relève du Conseil de la Nation huronne-wendat, et certaines unités locatives sont destinées en priorité aux Wendat. Informez-vous auprès du Conseil avant de commencer vos recherches.",
  hist: ["Au début du XVIIe siècle, les peuples de la confédération wendate vivent en Huronie, au sud-est du lac Huron, dans l’actuel Ontario. Ils cultivent le maïs, les courges et les haricots, chassent et pêchent. Leur réseau d’échanges s’étend autour des lacs Huron, Ontario et Érié.", "Les épidémies et la concurrence pour la traite des fourrures affaiblissent la confédération, envahie par les Iroquois en 1648. Des survivants s’établissent près de Québec. Leur communauté, alors connue sous le nom de Hurons de Lorette, est fondée en 1697.", "Une première chapelle Notre-Dame-de-Lorette est érigée en 1730. En 1784, le Village-des-Hurons compte 23 maisons et 105 habitants. Nicolas Vincent, Tsawenhohi, est Grand Chef de 1810 à 1844, et il se rend en Angleterre en 1825 avec une délégation pour réclamer la seigneurie de Sillery.", "La chapelle, en partie détruite par le feu en 1862, est reconstruite à l’identique. Elle est classée immeuble patrimonial en 1957 et désignée lieu historique national en 1981. Wendake fête ses 300 ans en 1997, et l’Hôtel-Musée Premières Nations, qui donne accès au Musée huron-wendat, est inauguré en 2008."],
  portrait: ["Wendake est une réserve autochtone enclavée dans la ville de Québec, autrefois appelée Village-des-Hurons. C’est le chef-lieu de la Nation huronne-wendat, et son nom signifie « chez les Wendats ». Le territoire se divise en deux : le Vieux-Wendake au sud, avec les maisons anciennes et la plupart des attraits, et un secteur plus récent au nord.", "Au recensement de 2021, Wendake comptait 2 200 habitants. Le Conseil de la Nation, dirigé par un Grand Chef et des chefs, s’occupe entre autres de l’éducation, de la santé, des loisirs et du logement. Le français est la langue d’usage, et la langue wendat fait l’objet d’un projet de revitalisation."],
  dates: [["1697", "Fondation de la communauté de Lorette"], ["1730", "Première chapelle Notre-Dame-de-Lorette"], ["1957", "Chapelle classée immeuble patrimonial"], ["1997", "Wendake fête ses 300 ans"], ["2008", "Ouverture de l’Hôtel-Musée Premières Nations"]],
  wiki: "https://fr.wikipedia.org/wiki/Wendake"
}, {
  s: "lac-delage",
  n: "Lac-Delage",
  dans: "à Lac-Delage",
  de: "de Lac-Delage",
  type: "ville",
  arrT: "MRC",
  arr: "La Jacques-Cartier",
  zone: "Rive-Nord",
  d: "Au nord de Québec, entre le secteur de Lac-Saint-Charles et Stoneham-et-Tewkesbury. La ville entoure le lac Delage, dans un relief boisé aux pentes parfois fortes.",
  situe: "Rive-Nord, au nord de Québec",
  chiffre: ["Locataires", "12,9 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Lac Delage", "Manoir du Lac Delage", "Empire 47"],
  vie: "Une petite ville de villégiature et de plein air, bâtie autour de son lac. On y pratique le vélo de montagne, au centre Empire 47 et lors d’événements annuels.",
  log: "Des chalets de montagne, des maisons bifamiliales et des maisons d’inspiration Nouvelle-France au nord-est du lac. À l’ouest, des terrains plus grands et très boisés, développés à partir de 1990.",
  pres: ["Lac Saint-Charles", "Rivière des Hurons", "Stoneham-et-Tewkesbury"],
  sav: "Lac-Delage touche le secteur de Lac-Saint-Charles, à Québec, au sud. La grande majorité des résidences sont reliées à l’aqueduc municipal.",
  hist: ["Sous la Nouvelle-France, les Jésuites empruntent le maître-sentier des Innus pour rejoindre le lac Saint-Jean. L’hiver, ce chemin longe le lac, alors compris dans la seigneurie de Saint-Ignace. Aucun colon n’y habite à l’époque.", "Le lac, alors appelé lac Larron, est rattaché au canton de Stoneham à sa création, en 1790. Au XIXe siècle, la bourgeoisie anglophone le fréquente, et le peintre Cornelius Krieghoff vient y peindre. Vers 1900, la famille Gails y établit la Rockland Farm, puis la famille Webster, propriétaire en 1939, y fait aménager une pente de ski dans les années 1940.", "Dans les années 1950, des promoteurs s’intéressent au site. Le 11 février 1959, une loi crée la ville du Lac Delage à partir de terres de Lac-Saint-Charles et de Stoneham-et-Tewkesbury. Le lac prend alors le nom du sénateur et député Cyrille Fraser Delâge, mort deux ans plus tôt.", "Le plan d’urbanisme de l’architecte Isaac Miron prévoit cinq quartiers d’une centaine de maisons, chacun autour d’une auberge. Le premier voit le jour entre 1962 et 1964, avec le Manoir du Lac Delage, mais la formule est abandonnée en 1970. À partir de 1990, la rive ouest est développée en grands terrains boisés."],
  portrait: ["Lac-Delage fait partie de la MRC de La Jacques-Cartier, dans la Capitale-Nationale. C’est la plus jeune municipalité de la MRC, et elle a le statut de ville malgré sa petite taille. Le Manoir du Lac Delage, un établissement hôtelier, est le principal moteur de l’économie locale.", "Le lac Delage couvre 0,49 km² et atteint 26 m de profondeur. Il se déverse dans le lac Saint-Charles par la rivière Delage, et la rivière des Hurons touche la limite sud de la ville."],
  dates: [["1790", "Le lac Larron rattaché au canton de Stoneham"], ["1939", "La famille Webster acquiert le domaine"], ["1959", "Création de la ville du Lac Delage"], ["1964", "Fin de la construction du Manoir"], ["1990", "Début du développement de la rive ouest"]],
  wiki: "https://fr.wikipedia.org/wiki/Lac-Delage"
}, {
  s: "saint-gabriel-de-valcartier",
  n: "Saint-Gabriel-de-Valcartier",
  dans: "à Saint-Gabriel-de-Valcartier",
  de: "de Saint-Gabriel-de-Valcartier",
  type: "ville",
  arrT: "MRC",
  arr: "La Jacques-Cartier",
  zone: "Rive-Nord",
  d: "Au nord de Québec, au pied des Laurentides, dans la vallée de la rivière Jacques-Cartier. Les habitations se concentrent le long de la rivière et de la route 371.",
  situe: "Rive-Nord, au nord de Québec",
  chiffre: ["Locataires", "20,1 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Rivière Jacques-Cartier", "Route 371", "Base Valcartier"],
  vie: "Une municipalité rurale et boisée, où francophones et anglophones vivent ensemble. Sa devise bilingue, « Ensemble, au cœur de la nature », date de 2005.",
  log: "Un milieu rural où les habitations se regroupent le long de la rivière Jacques-Cartier et de la route 371.",
  pres: ["Village Vacances Valcartier", "Piste cyclable Jacques-Cartier/Portneuf", "Église anglicane Christ Church"],
  sav: "Le centre-ville de Québec est à environ 25 km. La route 371 traverse la municipalité et la relie à l’arrondissement de La Haute-Saint-Charles, à Québec, au sud.",
  hist: ["Le territoire fait partie de la seigneurie de Saint-Gabriel, occupée dès 1647. C’est d’abord un domaine privé de Robert Giffard, puis des Jésuites, avant de passer à la Couronne en 1800.", "En 1812, les premiers colons tracent une route entre la rivière Jacques-Cartier et Loretteville. En 1815, quatre hommes d’affaires de Québec, dont John Neilson, achètent une grande partie des terres des Jésuites. Après l’appel à la colonisation lancé par Neilson en 1816, des colons écossais, irlandais, anglais et français s’installent et bâtissent maisons, scieries et moulins à farine.", "Les églises rappellent ces origines. L’église presbytérienne St. Andrews date de 1843, l’église catholique Saint-Gabriel de 1852 et l’église anglicane Christ Church de 1863. Reconnue comme municipalité en 1845, Saint-Gabriel-de-Valcartier est divisée le 18 mai 1861 pour former aussi Saint-Gabriel-Ouest.", "En août 1914, un camp d’entraînement est aménagé à Valcartier pour la Force expéditionnaire du Canada. C’est l’origine de la base actuelle. En 1963, Adrien Drouin ouvre un centre de glissades d’hiver, l’ancêtre du Village Vacances Valcartier, et les deux municipalités fusionnent en octobre 1985."],
  portrait: ["Saint-Gabriel-de-Valcartier fait partie de la MRC de La Jacques-Cartier, dans la Capitale-Nationale. Son nom joint celui de l’ancienne seigneurie de Saint-Gabriel à Valcartier, formé de val et de Cartier, pour la vallée de la rivière Jacques-Cartier. Les rivières Sainte-Anne et Jacques-Cartier traversent son vaste territoire.", "La municipalité se trouve à environ 25 km du centre-ville de Québec. Son économie repose surtout sur l’élevage de volailles et sur le Village Vacances Valcartier, parc aquatique l’été et centre de glissades l’hiver. La présence de la base des Forces canadiennes Valcartier, située sur son territoire, influence aussi fortement l’activité économique."],
  dates: [["1816", "Appel à la colonisation de John Neilson"], ["1861", "Division en deux municipalités"], ["1914", "Ouverture du camp militaire de Valcartier"], ["1963", "Premières glissades d’Adrien Drouin"], ["1985", "Fusion des deux municipalités"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Gabriel-de-Valcartier"
}, {
  s: "fossambault-sur-le-lac",
  n: "Fossambault-sur-le-Lac",
  dans: "à Fossambault-sur-le-Lac",
  de: "de Fossambault-sur-le-Lac",
  type: "ville",
  arrT: "MRC",
  arr: "La Jacques-Cartier",
  zone: "Rive-Nord",
  d: "Au nord-ouest de Québec, autour de la partie sud du lac Saint-Joseph. La route de Fossambault longe le lac et traverse la ville.",
  situe: "Rive-Nord, au nord-ouest de Québec",
  chiffre: ["Locataires", "8,9 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Lac Saint-Joseph", "Route de Fossambault", "Chapelle Saint-Joseph-du-Lac"],
  vie: "Une ville de villégiature au bord de l’eau, où les maisons se fondent dans une forêt dense. La population augmente l’été, quand les résidents saisonniers reviennent.",
  log: "Surtout des maisons et des chalets, dont plusieurs bâtiments de villégiature du début du XXe siècle. Certaines résidences d’été sont aujourd’hui habitées à l’année.",
  pres: ["Station touristique Duchesnay", "Piste cyclable Jacques-Cartier/Portneuf", "Sainte-Catherine-de-la-Jacques-Cartier"],
  sav: "Fossambault touche Sainte-Catherine-de-la-Jacques-Cartier au sud-ouest et Shannon au nord-est. Depuis 1973, un réseau d’aqueduc et d’égout dessert la majorité des résidences du lac.",
  hist: ["Au XIXe siècle, seuls quelques agriculteurs irlandais vivent aux abords du lac. En 1833, une trentaine de familles irlandaises, arrivées du Connecticut en 1817, occupent le secteur sud-est du lac. Le nom de la ville rend hommage à Jacques Nau de La Boissière et de Fossambault, conseiller du roi et trésorier des finances en Berry.", "Le chemin de fer arrive dans la région en 1869, et la villégiature commence en 1896, quand le notaire Cyprien Labrecque se fait construire une résidence. Des notaires, des médecins et des marchands de Québec suivent. La chapelle Saint-Joseph-du-Lac, entièrement en bois, est construite en 1902.", "En 1934, l’homme d’affaires Thomas Maher achète de la Consolidated Paper Corporation des terres autour du lac. Il les divise en lots pour les villégiateurs et exige, dans les contrats de vente, des maisons adaptées au paysage.", "Le village de Fossambault-sur-le-Lac est constitué le 10 mars 1949, avec Jules Gingras comme premier maire. La chapelle Notre-Dame-de-Liesse est érigée en 1950, et la municipalité obtient le statut de ville en 1974."],
  portrait: ["Fossambault-sur-le-Lac fait partie de la MRC de La Jacques-Cartier, dans la Capitale-Nationale. La ville occupe les terres autour de la partie sud du lac Saint-Joseph, un lac d’origine glaciaire situé à une trentaine de kilomètres de Québec. La rivière aux Pins traverse le nord de son territoire avant de se jeter dans le lac.", "Au recensement de 2021, la ville comptait 2 327 habitants. Le lac Saint-Joseph couvre 11,31 km² et mesure 8,1 km du nord au sud. La station touristique Duchesnay l’entoure à l’ouest, au nord et à l’est."],
  dates: [["1896", "Début de la villégiature"], ["1902", "Chapelle Saint-Joseph-du-Lac construite"], ["1934", "Thomas Maher achète les terres du lac"], ["1949", "Constitution du village"], ["1974", "Fossambault devient une ville"]],
  wiki: "https://fr.wikipedia.org/wiki/Fossambault-sur-le-Lac"
}, {
  s: "lac-saint-joseph",
  n: "Lac-Saint-Joseph",
  dans: "à Lac-Saint-Joseph",
  de: "de Lac-Saint-Joseph",
  type: "ville",
  arrT: "MRC",
  arr: "La Jacques-Cartier",
  zone: "Rive-Nord",
  d: "Au nord-ouest de Québec, sur les rives ouest, nord et est du lac Saint-Joseph. Le chemin Thomas-Maher fait le tour du lac sur le territoire de la ville.",
  situe: "Rive-Nord, au nord-ouest de Québec",
  chiffre: ["Locataires", "0,0 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Lac Saint-Joseph", "Chemin Thomas-Maher", "Mont Sorrel"],
  vie: "Une petite ville de villégiature, très boisée, dont les maisons occupent surtout le bord du lac. L’été, le Club nautique Saint-Louis anime le plan d’eau avec le ski nautique et le wakeboard.",
  log: "Surtout des résidences secondaires et des chalets. De plus en plus d’entre eux deviennent des résidences permanentes.",
  pres: ["Station touristique Duchesnay", "Club nautique Saint-Louis", "Fossambault-sur-le-Lac"],
  sav: "La ville n’a pratiquement pas de commerces : prévoyez faire vos courses à l’extérieur. La plupart des propriétés sont des résidences secondaires, et la population permanente est petite.",
  hist: ["Le lac apparaît sous le nom de lac Saint-Joseph sur une carte de Nicolas Sanson en 1656. Au début du XIXe siècle, on le désigne aussi par le nom autochtone d’Ontaritzi, et on l’a appelé Grand lac des Vents. Le nom de lac Saint-Joseph devient officiel en 1912.", "Le chemin de fer arrive dans la région en 1869 et favorise l’ouverture de moulins à scie. En 1888, la station de chemin de fer du lac Saint-Joseph se trouve à Duchesnay. Le notaire Cyprien Labrecque, en 1896, est l’un des premiers villégiateurs du lac.", "Vers 1934, Thomas Maher achète tout le pourtour du bassin nord du lac. Il fait construire une route de ceinture et vend les terrains situés entre la route et la rive. En quelques années, la plupart trouvent preneur, et les chalets se multiplient.", "La ville est constituée le 10 juin 1936, en se détachant de Sainte-Catherine-de-la-Jacques-Cartier. Thomas Maher est élu échevin le 30 septembre suivant, et le chemin qui fait le tour du lac porte aujourd’hui son nom."],
  portrait: ["Lac-Saint-Joseph fait partie de la MRC de La Jacques-Cartier, dans la Capitale-Nationale. La ville couvre la partie nord du lac Saint-Joseph et le borde à l’est, au nord et à l’ouest. Son territoire comprend aussi le mont Sorrel, à l’est du lac, que la rivière aux Pins contourne.", "Le lac Saint-Joseph couvre 11,31 km² et fait 22,4 km de tour. La station touristique Duchesnay, exploitée par la Sépaq, occupe la plus grande partie du territoire municipal."],
  dates: [["1656", "Le lac figure sur une carte de Sanson"], ["1896", "Arrivée des premiers villégiateurs"], ["1912", "Le nom de lac Saint-Joseph est officialisé"], ["1934", "Thomas Maher achète les terres du lac"], ["1936", "Constitution de la ville"]],
  wiki: "https://fr.wikipedia.org/wiki/Lac-Saint-Joseph"
}, {
  s: "sainte-petronille",
  n: "Sainte-Pétronille",
  dans: "à Sainte-Pétronille",
  de: "de Sainte-Pétronille",
  type: "ville",
  arrT: "MRC",
  arr: "L’Île-d’Orléans",
  zone: "Île d’Orléans",
  d: "À la pointe sud-ouest de l’île d’Orléans, face au Vieux-Québec et à Lévis. Le chemin Royal (route 368) traverse le village, qui donne sur le fleuve et la chute Montmorency.",
  situe: "Île d’Orléans, pointe sud-ouest de l’île, face à Québec",
  chiffre: ["Locataires", "10,8 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Chemin Royal", "Quai de Sainte-Pétronille", "Église Sainte-Pétronille"],
  vie: "Un petit village de villégiature, connu pour sa vue sur Québec, Lévis et la chute Montmorency. Il fait partie de l’Association des plus beaux villages du Québec.",
  log: "Des maisons anciennes et récentes, dont de grandes résidences d’été de style cottage bâties au XIXe siècle par des familles aisées de Québec, le long du chemin Royal.",
  pres: ["Chocolaterie de l’île d’Orléans", "St Mary’s Chapel", "Parc de la Chute-Montmorency"],
  sav: "Le pont de l’Île-d’Orléans, à Saint-Pierre, relie l’île à Beauport. Le transport collectif PLUmobile dessert l’île du lundi au vendredi, avec des correspondances vers Québec.",
  hist: ["Le territoire fait partie de la seigneurie de l’Île-d’Orléans, concédée à Jacques Castillon le 15 janvier 1636. En 1651, le jésuite Chaumonot y établit des Wendats (Hurons) réfugiés, sans doute près de l’actuel quai. L’année suivante, Éléonore de Grandmaison y épouse Jacques Gourdeau de Beaulieu, qui donne son nom au fief.", "Pendant deux siècles, le secteur est partagé entre les paroisses de Saint-Pierre, au nord, et de Saint-Laurent, au sud. La terre y est moins fertile qu’ailleurs sur l’île, et on la cultive peu. En 1759, le général Wolfe y installe un de ses quartiers pour mener le siège de Québec. Vers 1820, un chantier maritime y construit deux grands navires, le Colombus et le Baron Renfrew.", "Dès le milieu du XIXe siècle, des centaines de promeneurs du dimanche s’y rendent en traversier. Des familles aisées de Québec, dont les Boswell, brasseurs, se font construire des résidences d’été le long du chemin Royal. Le peintre Horatio Walker y travaille dans son atelier jusqu’à sa mort, en 1938.", "En 1870, le secteur est détaché de Saint-Pierre et érigé en paroisse sous le nom de Sainte-Pétronille de Beaulieu. Une municipalité de village y est créée en 1874 sous le nom de Beaulieu, en l’honneur de Jacques Gourdeau de Beaulieu. Elle adopte officiellement le nom de Sainte-Pétronille en 1980."],
  portrait: ["Sainte-Pétronille fait partie de la MRC de L’Île-d’Orléans, dans la Capitale-Nationale. C’est la plus jeune des six paroisses de l’île, longtemps surnommée le Bout de l’Île. Du village, on voit le Vieux-Québec sur le cap Diamant, Lévis sur la rive sud et, sur la rive nord, la chute Montmorency, haute de 80 m.", "En 1868, on y aménage le premier club de golf en Amérique du Nord, un parcours de trois trous. L’église Sainte-Pétronille, construite en 1871 sur un promontoire, a un intérieur sobre réalisé par David Ouellet. Le village compte aussi St Mary’s Chapel, une chapelle anglicane en bois éclairée par des vitraux posés en 1904."],
  dates: [["1651", "Des Wendats s’installent à la pointe"], ["1759", "Wolfe y installe un quartier militaire"], ["1868", "Premier club de golf d’Amérique du Nord"], ["1870", "Érection de la paroisse"], ["1980", "Adoption du nom Sainte-Pétronille"]],
  wiki: "https://fr.wikipedia.org/wiki/Sainte-Pétronille"
}, {
  s: "saint-pierre-de-l-ile-d-orleans",
  n: "Saint-Pierre-de-l’Île-d’Orléans",
  dans: "à Saint-Pierre-de-l’Île-d’Orléans",
  de: "de Saint-Pierre-de-l’Île-d’Orléans",
  type: "ville",
  arrT: "MRC",
  arr: "L’Île-d’Orléans",
  zone: "Île d’Orléans",
  d: "Dans l’ouest de l’île d’Orléans, là où arrive le pont de l’Île-d’Orléans. Le village s’étend le long du chemin Royal (route 368), entre Sainte-Pétronille et Sainte-Famille.",
  situe: "Île d’Orléans, à l’arrivée du pont",
  chiffre: ["Locataires", "26,8 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Pont de l’Île-d’Orléans", "Ancienne église de Saint-Pierre", "Espace Félix-Leclerc"],
  vie: "Un village agricole devenu plus résidentiel après l’ouverture du pont, en 1935. C’est la porte d’entrée de l’île, et Félix Leclerc y a vécu jusqu’à sa mort.",
  log: "Des maisons anciennes et récentes le long du chemin Royal, des secteurs résidentiels développés après la construction du pont et des fermes.",
  pres: ["Village de Sainte-Pétronille", "Parc de la Chute-Montmorency", "Église de la Sainte-Famille"],
  sav: "Le pont relie Saint-Pierre à Beauport, où la route 368 rejoint la route 138 et l’autoroute 40. Un nouveau pont à haubans doit le remplacer, avec une mise en service prévue vers 2028. PLUmobile offre du transport collectif du lundi au vendredi.",
  hist: ["Le territoire fait partie de la seigneurie de l’Île-d’Orléans, concédée le 15 janvier 1636. Les premiers habitants s’y installent vers 1660, et une chapelle en bois y est construite en 1673. La paroisse de Saint-Pierre-et-Saint-Paul est fondée en 1679. Elle comprend alors le territoire actuel de Sainte-Pétronille.", "L’église de pierre est construite entre 1717 et 1719. De 1734 à 1788, Mgr Louis-Philippe Mariauchau d’Esgly, premier évêque de Québec né au Canada, y est curé pendant 54 ans. En 1759, l’armée britannique de Wolfe fait de l’église et du presbytère un hôpital militaire et un quartier général.", "Une municipalité de paroisse est créée en 1845, abolie en 1847, puis rétablie en 1855 sous le nom de Saint-Pierre-et-Saint-Paul. L’usage retient surtout le nom Saint-Pierre. Le premier Cercle de fermières de l’île y voit le jour en 1923, et le pont de l’Île-d’Orléans est ouvert à la circulation le 6 juillet 1935.", "Menacée de démolition, l’ancienne église est achetée par le gouvernement du Québec en 1954, puis classée en 1958. Félix Leclerc s’installe sur l’île et meurt chez lui, à Saint-Pierre, le 8 août 1988. La municipalité prend le nom de Saint-Pierre-de-l’Île-d’Orléans en 1997."],
  portrait: ["Saint-Pierre-de-l’Île-d’Orléans fait partie de la MRC de L’Île-d’Orléans, dans la Capitale-Nationale. La municipalité se trouve entre Sainte-Pétronille, au sud-ouest, et Sainte-Famille, au nord-est, dont la sépare la rivière Pot au Beurre. Le pont de l’Île-d’Orléans y touche l’île, et son ouverture en 1935 a rendu la localité plus peuplée et moins agricole.", "L’ancienne église, bâtie entre 1717 et 1719, est considérée comme la plus ancienne église du Québec. Classée en 1958, elle est fermée au culte, et une église moderne a été construite à côté en 1955. Félix Leclerc repose au cimetière du village, et l’Espace Félix-Leclerc, construit en 2002 à l’entrée du village, fait connaître son œuvre."],
  dates: [["1679", "Fondation de la paroisse"], ["1717", "Début de la construction de l’église"], ["1935", "Ouverture du pont de l’Île-d’Orléans"], ["1958", "Classement de l’ancienne église"], ["2002", "Construction de l’Espace Félix-Leclerc"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Pierre-de-l%27Île-d%27Orléans"
}, {
  s: "saint-laurent-de-l-ile-d-orleans",
  n: "Saint-Laurent-de-l’Île-d’Orléans",
  dans: "à Saint-Laurent-de-l’Île-d’Orléans",
  de: "de Saint-Laurent-de-l’Île-d’Orléans",
  type: "ville",
  arrT: "MRC",
  arr: "L’Île-d’Orléans",
  zone: "Île d’Orléans",
  d: "Sur la côte sud de l’île d’Orléans, à environ 11 km à l’est de Sainte-Pétronille. Le village s’étire au pied d’un coteau, face à la Côte-du-Sud, et le chemin Royal (route 368) longe le fleuve.",
  situe: "Île d’Orléans, côte sud de l’île",
  chiffre: ["Locataires", "16,8 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Musée maritime de l’île d’Orléans", "Église de Saint-Laurent", "Chemin Royal"],
  vie: "Un village tourné vers le fleuve, avec un quai, une marina et une longue tradition de construction de chaloupes. Les cultures maraîchères y occupent une grande place.",
  log: "Des maisons le long du chemin Royal, dont plusieurs bâtiments anciens, et des terres agricoles. Le village fait partie du site patrimonial de l’Île-d’Orléans.",
  pres: ["Marina de l’île d’Orléans", "Manoir Mauvide-Genest", "Village de Sainte-Pétronille"],
  sav: "Le pont de l’Île-d’Orléans, à Saint-Pierre, relie l’île à Québec. Le chemin Royal fait le tour de l’île, et PLUmobile offre du transport collectif du lundi au vendredi.",
  hist: ["Le territoire fait partie de la seigneurie de l’Île-d’Orléans, concédée le 15 janvier 1636, et il est peuplé vers 1660. Une première chapelle en bois y est construite en 1675. La paroisse est fondée en 1679 sous le nom de Saint-Paul. Au XVIIe siècle, l’endroit est aussi connu sous le nom de L’Arbre-Sec.", "En 1698, à la demande de François Berthelot, comte de Saint-Laurent, la paroisse prend le nom de Saint-Laurent, en souvenir du diacre romain. Une église de pierre y est construite à la fin du XVIIe siècle. En 1759, le général Wolfe installe ses quartiers dans la paroisse, et le curé obtient de lui que l’église soit épargnée.", "Le village vit beaucoup du fleuve. Vers 1830, il compte une vingtaine de chaloupiers, et la chalouperie Godbout est construite en 1837. La première école ouvre en 1842, et les Sœurs du Bon Pasteur s’installent au village en 1875. L’église actuelle est bâtie en 1860 selon les plans de l’architecte Raphaël Giroux.", "Une première municipalité voit le jour en 1845, et la municipalité de la paroisse de Saint-Laurent est créée en 1855. De 1905 à 1967, le chantier maritime de Saint-Laurent Limitée construit de nombreuses barques. En 1998, la municipalité prend le nom de Saint-Laurent-de-l’Île-d’Orléans."],
  portrait: ["Saint-Laurent-de-l’Île-d’Orléans fait partie de la MRC de L’Île-d’Orléans, dans la Capitale-Nationale. Sur la côte sud de l’île, le village s’étire au pied d’un coteau qui donne vue sur la Côte-du-Sud. Son caractère maritime se voit au quai, au parc maritime et au club nautique, qui peut accueillir près de 150 embarcations.", "Le Musée maritime de l’île d’Orléans, propriété de la municipalité, reçoit environ 15 000 visiteurs par année. Il comprend la chalouperie Godbout, construite en 1837, et un centre d’interprétation sur la construction navale. L’église actuelle date de 1860, et son décor intérieur, réalisé en 1863 par Charles Baillairgé, utilise des ornements moulés en plâtre plutôt qu’en bois."],
  dates: [["1679", "Fondation de la paroisse Saint-Paul"], ["1698", "La paroisse devient Saint-Laurent"], ["1837", "Construction de la chalouperie Godbout"], ["1860", "Construction de l’église actuelle"], ["1905", "Ouverture du chantier maritime"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Laurent-de-l%27Île-d%27Orléans"
}, {
  s: "sainte-famille-de-l-ile-d-orleans",
  n: "Sainte-Famille-de-l’Île-d’Orléans",
  dans: "à Sainte-Famille-de-l’Île-d’Orléans",
  de: "de Sainte-Famille-de-l’Île-d’Orléans",
  type: "ville",
  arrT: "MRC",
  arr: "L’Île-d’Orléans",
  zone: "Île d’Orléans",
  d: "Sur la côte nord-est de l’île d’Orléans, face au chenal de l’Île d’Orléans et à la Côte-de-Beaupré. Le chemin Royal (route 368) traverse la municipalité, entre Saint-Pierre et Saint-François.",
  situe: "Île d’Orléans, côte nord de l’île",
  chiffre: ["Locataires", "16,4 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église de la Sainte-Famille", "Maison Drouin", "Chemin Royal"],
  vie: "Une municipalité agricole, connue pour ses maisons de pierre du Régime français. On y cultive surtout des pommes, des fraises et des légumes.",
  log: "Des maisons et des fermes le long du chemin Royal. Plusieurs maisons anciennes ont une grande valeur patrimoniale, et certaines sont classées par le gouvernement du Québec.",
  pres: ["Maison de nos Aïeux", "Tour d’observation de Saint-François", "Espace Félix-Leclerc"],
  sav: "Le pont de l’Île-d’Orléans arrive à Saint-Pierre, la municipalité voisine au sud-ouest. PLUmobile offre du transport collectif du lundi au vendredi, avec des correspondances vers Québec.",
  hist: ["Le territoire fait partie de la seigneurie de l’Île-d’Orléans, concédée le 15 janvier 1636. Le 2 avril 1656, Guillaume Baucher dit Montmorency y reçoit une terre de trois arpents. Ses descendants prendront le nom de Morency.", "Fondée en 1661, Sainte-Famille est la seule paroisse de l’île jusqu’en 1679, et on l’appelle alors la Paroisse de l’Île. Une première église de pierre y est construite dès 1669. Le nom vient de la dévotion de Mgr de Laval envers la Sainte Famille de Nazareth, et la paroisse est érigée canoniquement en 1684.", "Les sœurs de la Congrégation de Notre-Dame y ouvrent un couvent dès 1685. En 1698, après une crise économique, le Conseil souverain crée le Bureau des pauvres de Sainte-Famille pour venir en aide aux plus démunis. L’église actuelle est construite entre 1743 et 1747. En 1759, des soldats anglais l’envahissent et retirent la cloche pour empêcher les paroissiens de donner l’alarme.", "La municipalité de paroisse est créée en 1845 sous le nom de La Sainte-Famille, Isle d’Orléans, puis devient La Sainte-Famille dix ans plus tard. En 1996, la Fondation François-Lamy achète la maison Drouin et en fait un centre d’interprétation, classé en 2010. Le 9 décembre 2017, la municipalité prend le nom de Sainte-Famille-de-l’Île-d’Orléans."],
  portrait: ["Sainte-Famille-de-l’Île-d’Orléans est le chef-lieu de la MRC de L’Île-d’Orléans, dans la Capitale-Nationale. Son territoire accidenté, coupé de nombreux ruisseaux, se divise entre le Haut-de-Sainte-Famille, près de Saint-Pierre, et le Bas-de-Sainte-Famille, près de Saint-François. La rivière Pot au Beurre y prend sa source avant de couler vers Saint-Pierre.", "C’est la plus ancienne municipalité de l’île, et on y trouve la plus forte concentration de maisons de pierre du Régime français. La maison Drouin, bâtie vers 1730, est l’une des rares épargnées par les troupes de Wolfe en 1759. L’église, construite entre 1743 et 1747, est classée depuis 1980."],
  dates: [["1656", "Terre concédée à Guillaume Baucher"], ["1661", "Fondation de la paroisse"], ["1669", "Première église de pierre"], ["1743", "Début de la construction de l’église"], ["2017", "Adoption du nom actuel"]],
  wiki: "https://fr.wikipedia.org/wiki/Sainte-Famille-de-l%27Île-d%27Orléans"
}, {
  s: "saint-jean-de-l-ile-d-orleans",
  n: "Saint-Jean-de-l’Île-d’Orléans",
  dans: "à Saint-Jean-de-l’Île-d’Orléans",
  de: "de Saint-Jean-de-l’Île-d’Orléans",
  type: "ville",
  arrT: "MRC",
  arr: "L’Île-d’Orléans",
  zone: "Île d’Orléans",
  d: "Sur la côte sud de l’île d’Orléans, entre Saint-Laurent et Saint-François, face au chenal des Grands Voiliers. Le chemin Royal (route 368) longe le fleuve et traverse le village.",
  situe: "Île d’Orléans, côte sud de l’île",
  chiffre: ["Locataires", "24,2 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Manoir Mauvide-Genest", "Église de Saint-Jean", "Chemin Royal"],
  vie: "Un village riverain au passé agricole et maritime, connu comme un village de pilotes du Saint-Laurent. Une promenade longe la grève du fleuve.",
  log: "Des maisons et des fermes le long du chemin Royal. Plusieurs maisons et granges anciennes ont un statut patrimonial.",
  pres: ["Musée maritime de l’île d’Orléans", "Tour d’observation de Saint-François", "Église de Saint-François"],
  sav: "Le village est à environ 26 km à vol d’oiseau au nord-est de Québec. On accède à l’île par le pont de l’Île-d’Orléans, à Saint-Pierre, et PLUmobile offre du transport collectif du lundi au vendredi.",
  hist: ["Le territoire fait partie de la seigneurie de l’Île-d’Orléans, concédée le 15 janvier 1636. Une chapelle en bois y est construite en 1675. À partir de 1680, Saint-Jean est une mission desservie par le curé de Sainte-Famille, puis elle devient une paroisse en 1714.", "En 1734, le chirurgien Jean Mauvide et son épouse, Marie-Anne Genest, font bâtir une maison de pierre qu’ils agrandissent ensuite en manoir. Enrichi par le commerce maritime, Mauvide achète la moitié sud-ouest de la seigneurie en 1752. La construction de l’église commence aussi en 1734 et se termine en 1737. En 1759, le manoir est l’une des rares habitations épargnées par les troupes de Wolfe.", "Une municipalité est créée en 1845 sous le nom de Saint-Jean, Isle d’Orléans, puis la municipalité de paroisse de Saint-Jean-Baptiste en 1855. En 1852, l’église est agrandie selon les plans de l’architecte Louis-Thomas Berlinguet, qui lui donne une façade néoclassique. Saint-Jean est aussi un village de pilotes, qui guident les navires sur le Saint-Laurent.", "Jean-Charles Bonenfant, futur directeur de la bibliothèque de la Législature, y naît en 1912. En 1926, le juge Joseph-Camille Pouliot achète le manoir, alors en mauvais état, et le restaure. L’église est classée en 1957 et le manoir en 1971. En 2003, la municipalité prend le nom de Saint-Jean-de-l’Île-d’Orléans."],
  portrait: ["Saint-Jean-de-l’Île-d’Orléans fait partie de la MRC de L’Île-d’Orléans, dans la Capitale-Nationale. Elle s’étend sur 11 km, de la rivière Maheu à la rivière Dauphine, qui la sépare de Saint-François. C’est l’une des plus grandes municipalités de l’île, et la rivière Lafleur la traverse aussi.", "Au XIXe siècle, sa population en faisait la capitale de l’île. Le manoir Mauvide-Genest, érigé en 1734, est classé depuis 1971 et désigné lieu historique national du Canada depuis 1993. Il abrite un centre d’interprétation sur le régime seigneurial. L’église, construite entre 1734 et 1737 au bord du fleuve, est classée depuis 1957."],
  dates: [["1680", "Mission desservie par Sainte-Famille"], ["1714", "Érection de la paroisse"], ["1734", "Construction du manoir Mauvide-Genest"], ["1993", "Manoir désigné lieu historique national"], ["2003", "Adoption du nom actuel"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Jean-de-l%27Île-d%27Orléans"
}, {
  s: "saint-francois-de-l-ile-d-orleans",
  n: "Saint-François-de-l’Île-d’Orléans",
  dans: "à Saint-François-de-l’Île-d’Orléans",
  de: "de Saint-François-de-l’Île-d’Orléans",
  type: "ville",
  arrT: "MRC",
  arr: "L’Île-d’Orléans",
  zone: "Île d’Orléans",
  d: "À la pointe nord-est de l’île d’Orléans, face aux îles Madame et au Ruau, à quelque 40 km en aval de Québec. Le chemin Royal (route 368) contourne la pointe de l’île.",
  situe: "Île d’Orléans, pointe nord-est de l’île",
  chiffre: ["Locataires", "3,8 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église de Saint-François", "Tour d’observation de Saint-François", "Chemin Royal"],
  vie: "Une municipalité agricole qui fait face aux îles Madame et au Ruau. La pointe de l’île marque la limite entre le fleuve Saint-Laurent et son estuaire.",
  log: "Des maisons et des fermes le long du chemin Royal, dans un territoire surtout agricole.",
  pres: ["Plage de Saint-François", "Maison Drouin", "Manoir Mauvide-Genest"],
  sav: "Le village est à quelque 40 km en aval de Québec. On y accède par le pont de l’Île-d’Orléans, à Saint-Pierre, puis par le chemin Royal, d’un côté ou de l’autre de l’île. PLUmobile offre du transport collectif du lundi au vendredi.",
  hist: ["En 1535, Jacques Cartier appelle l’île « isle de Bacchus » à cause des vignes sauvages, nombreuses dans le secteur de Saint-François. Il la rebaptise peu après île d’Orléans. Le territoire fait partie de la seigneurie de l’Île-d’Orléans, concédée le 15 janvier 1636.", "Fondée en 1679, la paroisse est érigée canoniquement en 1714 sous le nom de Saint-François-de-Sales. Le nom rappelle François Berthelot, seigneur de l’île en 1675, et saint François de Sales, auteur de l’Introduction à la vie dévote.", "L’église de pierre est construite en 1734. En 1759, les troupes britanniques la réquisitionnent et en font un hôpital et une infirmerie pour les soldats de Wolfe. En 1988, des travaux de restauration mettent au jour un graffiti laissé par David Chapman, artilleur du navire de guerre britannique Neptune.", "Une première municipalité de paroisse, Saint-François-Isle-d’Orléans, est créée en 1845, puis intégrée à la municipalité de comté en 1847. La municipalité de paroisse de Saint-François est établie en 1855. En 2003, elle devient la municipalité de Saint-François-de-l’Île-d’Orléans."],
  portrait: ["Saint-François-de-l’Île-d’Orléans fait partie de la MRC de L’Île-d’Orléans, dans la Capitale-Nationale. Son territoire, en forme de triangle, couvre 16 % de la superficie de l’île, à l’est de Sainte-Famille et de Saint-Jean. Sous le Régime français, le fief d’Argentenay en couvrait une partie.", "Ses habitants vivent surtout de l’agriculture. Selon la Commission de toponymie, les vignes sauvages qui couvraient jadis le secteur ont inspiré à Jacques Cartier le nom d’île de Bacchus. L’église, bâtie en pierre en 1734, a servi d’hôpital aux soldats de Wolfe en 1759."],
  dates: [["1679", "Fondation de la paroisse"], ["1714", "Érection canonique de la paroisse"], ["1734", "Construction de l’église de pierre"], ["1759", "L’église sert d’hôpital militaire"], ["2003", "Adoption du nom actuel"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-François-de-l%27Île-d%27Orléans"
}, {
  s: "l-ange-gardien",
  n: "L’Ange-Gardien",
  dans: "à L’Ange-Gardien",
  de: "de L’Ange-Gardien",
  type: "ville",
  arrT: "MRC",
  arr: "La Côte-de-Beaupré",
  zone: "Rive-Nord",
  d: "Sur la Côte-de-Beaupré, entre Boischatel et Château-Richer, face à l’île d’Orléans. L’avenue Royale et le boulevard Sainte-Anne (route 138) la traversent d’ouest en est.",
  situe: "Côte-de-Beaupré, au nord-est de Québec",
  chiffre: ["Locataires", "15,3 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Avenue Royale", "Parc riverain espace Fillion", "Chapelles de procession"],
  vie: "Une municipalité devenue semi-urbaine qui garde ses racines agricoles. On y trouve des granges centenaires le long de l’avenue Royale, des producteurs qui vendent à la ferme et des zones de villégiature autour du lac de la Retenue.",
  log: "Des maisons anciennes le long de l’avenue Royale, dont certaines en pierre ont plus de trois siècles, et des secteurs résidentiels plus récents au nord de la municipalité, en milieu boisé.",
  pres: ["Vignoble Domaine L’Ange-Gardien", "Véloroute Marie-Hélène-Prémont", "Parc de la Chute-Montmorency"],
  sav: "Le centre-ville de Québec est à environ 20 minutes. Le transport collectif PLUmobile dessert L’Ange-Gardien du lundi au vendredi, avec des correspondances vers Québec et Sainte-Foy.",
  hist: ["Le 3 décembre 1655, Pierre Maheut et Jean Trudelle s’engagent par contrat à défricher cinq arpents de terre à l’est de la chute Montmorency, dans l’actuel Boischatel. Le 29 septembre 1657, ils deviennent les deux premiers colons permanents. La majorité des colons arrivent de Normandie.", "Le 18 octobre 1664, une première messe est célébrée dans la maison de Jean Trudelle, et le territoire se détache de Château-Richer. La même année, Mgr de Laval érige la paroisse des Saints-Anges-Gardiens, qui compte environ 125 habitants. Une église de pierre est bâtie près du fleuve en 1675, puis une nouvelle église en 1717, à l’emplacement de l’église actuelle.", "En 1721, les limites de la paroisse sont fixées de la rivière du Petit Pré au sault de Montmorency. Deux chapelles de procession en pierre sont construites en 1753. La municipalité de paroisse est créée en 1845, abolie en 1847, puis rétablie en 1855. Le 3 avril 1920, Saint-Jean-de-Boischatel se détache de L’Ange-Gardien.", "En 1925, la paroisse compte 1 825 habitants. L’église est détruite par un incendie en 1931, puis remplacée par l’église actuelle. Le nom officiel devient L’Ange-Gardien en 1969, et la municipalité de paroisse prend le statut de municipalité en 2007."],
  portrait: ["L’Ange-Gardien fait partie de la MRC de La Côte-de-Beaupré, dans la Capitale-Nationale. La municipalité fait face au chenal de l’Île d’Orléans et s’étend vers le nord dans une zone forestière, où coulent les rivières Ferrée et la Retenue. Ses coteaux en terrasses ont longtemps servi à l’agriculture, et ses nombreux cours d’eau ont servi à l’industrie d’autrefois, liée au blé et au bois.", "Située à 18 km au nord-est de Québec, c’est la troisième plus ancienne paroisse de la Côte-de-Beaupré. Elle conserve deux chapelles de procession en pierre construites en 1753. L’église, rebâtie après un incendie en 1931, domine le fleuve à côté de l’ancien presbytère, devenu le bureau municipal en 2008."],
  dates: [["1657", "Arrivée des premiers colons permanents"], ["1664", "Érection de la paroisse"], ["1753", "Construction des chapelles de procession"], ["1920", "Boischatel se détache de la paroisse"], ["2007", "Statut de municipalité"]],
  wiki: "https://fr.wikipedia.org/wiki/L%27Ange-Gardien_(La_Côte-de-Beaupré)"
}, {
  s: "chateau-richer",
  n: "Château-Richer",
  dans: "à Château-Richer",
  de: "de Château-Richer",
  type: "ville",
  arrT: "MRC",
  arr: "La Côte-de-Beaupré",
  zone: "Rive-Nord",
  d: "Sur la Côte-de-Beaupré, entre L’Ange-Gardien et Sainte-Anne-de-Beaupré, face à l’île d’Orléans. L’avenue Royale (route 360) et la route 138 la traversent le long du fleuve.",
  situe: "Côte-de-Beaupré, au nord-est de Québec",
  chiffre: ["Locataires", "11,5 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Avenue Royale", "Église de La Visitation-de-Notre-Dame", "Moulin du Petit-Pré"],
  vie: "Une ville étirée le long du fleuve, avec un noyau villageois autour de l’église et du vieux couvent. Dans l’arrière-pays, les Concessions vivent de la forêt, de la villégiature, de l’équitation et du traîneau à chiens.",
  log: "Des maisons anciennes le long de l’avenue Royale, des secteurs plus urbains comme Sault-à-la-Puce et des propriétés rurales dans les rangs de l’arrière-pays.",
  pres: ["Sanctuaire Sainte-Anne-de-Beaupré", "Véloroute Marie-Hélène-Prémont", "Espace culturel Richard-Verreau"],
  sav: "L’avenue Royale et la route 138 mènent à Québec en passant par L’Ange-Gardien et Boischatel. Le transport collectif PLUmobile dessert la Côte-de-Beaupré du lundi au vendredi.",
  hist: ["La colonisation française commence avec la création de la seigneurie de Beaupré, en 1636. Olivier Le Tardif concède les premières terres aux colons, et la mission catholique est fondée en 1640. Les trois frères Gagnon, ancêtres des Gagnon d’Amérique, s’y installent à la même époque.", "Le nom Château-Richer apparaît sur une carte de l’arpenteur Jean Bourdon au début des années 1640. Il désignait alors le promontoire où se dresse l’église, et son origine reste obscure. Le premier curé résidant arrive en 1661, et la paroisse de La Visitation-de-Notre-Dame est érigée canoniquement le 30 octobre 1678.", "Dès les années 1660, le bailliage de Beaupré, un tribunal seigneurial, siège à Château-Richer. En 1694, Mgr de Laval fait construire un premier couvent pour l’instruction des jeunes filles, confié à la Congrégation de Notre-Dame. Le moulin à eau du Petit-Pré, bâti à la fin du XVIIe siècle pour le Séminaire de Québec, est l’un des plus vieux moulins à farine commerciaux d’Amérique du Nord.", "Vers 1840, des Irlandais catholiques s’installent dans l’arrière-pays, les Concessions, mais la pauvreté des sols les pousse à partir. Des familles canadiennes-françaises les remplacent la décennie suivante. L’église actuelle est construite en 1866, le vieux couvent en 1907, et Château-Richer obtient le statut de ville en 1968."],
  portrait: ["Château-Richer est le chef-lieu de la MRC de La Côte-de-Beaupré, dans la Capitale-Nationale. Elle s’étend du fleuve Saint-Laurent jusqu’aux contreforts des Laurentides et touche à L’Ange-Gardien, à Sainte-Anne-de-Beaupré et à Sainte-Brigitte-de-Laval. Plusieurs rivières la traversent, dont la rivière du Sault à la Puce, qui forme une cascade de 18 m dans la falaise de la Grande Côte.", "La ville mesure 11 km d’est en ouest. Dans l’arrière-pays, les Concessions comptent environ 300 résidents permanents, et jusqu’à 600 en été. Le site patrimonial de la Place-de-l’Église réunit l’église de La Visitation-de-Notre-Dame, le presbytère de 1833 et un cimetière du XVIIe siècle."],
  dates: [["1640", "Fondation de la mission catholique"], ["1678", "Érection canonique de la paroisse"], ["1694", "Premier couvent, voulu par Mgr de Laval"], ["1866", "Construction de l’église actuelle"], ["1968", "Château-Richer devient une ville"]],
  wiki: "https://fr.wikipedia.org/wiki/Château-Richer"
}, {
  s: "sainte-anne-de-beaupre",
  n: "Sainte-Anne-de-Beaupré",
  dans: "à Sainte-Anne-de-Beaupré",
  de: "de Sainte-Anne-de-Beaupré",
  type: "ville",
  arrT: "MRC",
  arr: "La Côte-de-Beaupré",
  zone: "Rive-Nord",
  d: "Sur la Côte-de-Beaupré, à environ 23 km à l’est de Québec, le long du chenal de l’île d’Orléans. Le boulevard Sainte-Anne et l’avenue Royale la traversent, et la basilique en est le grand repère.",
  situe: "Côte-de-Beaupré, à 23 km à l’est de Québec",
  chiffre: ["Locataires", "45,7 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Basilique Sainte-Anne-de-Beaupré", "Boulevard Sainte-Anne", "Avenue Royale"],
  vie: "Une ville de pèlerinage au bord du fleuve. Elle s’anime l’été et autour du 26 juillet, fête de sainte Anne, et compte plusieurs restaurants et entreprises touristiques.",
  log: "Un mélange de maisons individuelles, de duplex et de petits immeubles à logements. Au recensement de 2021, près d’un ménage sur deux était locataire.",
  pres: ["Mont-Sainte-Anne", "Canyon Sainte-Anne", "Île d’Orléans"],
  sav: "Le boulevard Sainte-Anne (route 138) mène à Québec en une trentaine de minutes. Les pèlerins sont nombreux près de la basilique l’été, surtout autour du 26 juillet.",
  hist: ["Le 27 mars 1650, Étienne Racine reçoit la première terre concédée et exploitée de l’endroit. Le plan terrier de 1658 nomme une trentaine de premiers colons, dont Étienne de Lessard, Claude Poulin et Noël Racine.", "En 1658, Étienne de Lessard donne un terrain pour bâtir une chapelle dédiée à sainte Anne. Selon la tradition, des marins bretons sauvés d’un naufrage auraient voulu ce sanctuaire. La guérison d’un ouvrier, Louis Guimont, pendant les travaux attire les premiers pèlerins, et une église de pierre est construite en 1676.", "Une église plus vaste est construite à partir de 1872, et les Rédemptoristes prennent le sanctuaire en charge dès 1877. L’arrivée du chemin de fer, en 1881, facilite les pèlerinages, et le pape Léon XIII donne à l’église le titre de basilique mineure. En 1895, le Cyclorama de Jérusalem, une immense toile panoramique, est installé dans la ville.", "Un incendie détruit la basilique le 29 mars 1922. L’édifice actuel, de style néo-roman, est construit au cours des décennies suivantes et consacré en 1976. La ville actuelle naît en 1973 de la fusion de la municipalité de village et de la municipalité de paroisse. Le pape Jean-Paul II visite le sanctuaire en 1984, et le pape François en 2022."],
  portrait: ["Sainte-Anne-de-Beaupré fait partie de la MRC de La Côte-de-Beaupré, dans la Capitale-Nationale. La population vit surtout sur une étroite bande de rivage, large de moins d’un kilomètre, au pied de terrasses d’une centaine de mètres. Plus au nord, le territoire atteint les premiers sommets des Laurentides, et la rivière aux Chiens le traverse jusqu’au fleuve.", "Au recensement de 2021, la ville comptait 2 888 habitants. Sa basilique est l’un des principaux lieux de pèlerinage d’Amérique du Nord et reçoit plusieurs centaines de milliers de visiteurs par année."],
  dates: [["1650", "Première terre concédée, à Étienne Racine"], ["1658", "Première chapelle dédiée à sainte Anne"], ["1922", "Incendie de la basilique"], ["1973", "Fusion qui crée la ville actuelle"], ["1984", "Visite du pape Jean-Paul II"]],
  wiki: "https://fr.wikipedia.org/wiki/Sainte-Anne-de-Beaupré"
}, {
  s: "beaupre",
  n: "Beaupré",
  dans: "à Beaupré",
  de: "de Beaupré",
  type: "ville",
  arrT: "MRC",
  arr: "La Côte-de-Beaupré",
  zone: "Rive-Nord",
  d: "Sur la Côte-de-Beaupré, au bord du fleuve, là où la rivière Sainte-Anne se jette dans le Saint-Laurent. Le mont Sainte-Anne et sa station de ski se trouvent sur son territoire.",
  situe: "Côte-de-Beaupré, à l’embouchure de la rivière Sainte-Anne",
  chiffre: ["Locataires", "29,8 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Mont-Sainte-Anne", "Rivière Sainte-Anne", "Boulevard Sainte-Anne"],
  vie: "Une ville à la fois résidentielle et touristique, tournée vers le plein air. La station du mont Sainte-Anne y attire les skieurs l’hiver et les cyclistes de montagne l’été.",
  log: "Surtout des maisons individuelles, mais aussi des maisons jumelées, des duplex et de petits immeubles à logements. Au recensement de 2021, environ trois ménages sur dix étaient locataires.",
  pres: ["Canyon Sainte-Anne", "Basilique Sainte-Anne-de-Beaupré", "Réserve nationale de faune du Cap-Tourmente"],
  sav: "Le boulevard Sainte-Anne (route 138) et l’avenue Royale (route 360) relient Beaupré à Québec, à environ 40 km à l’ouest. La route 360 mène aussi à la station du mont Sainte-Anne.",
  hist: ["Le nom Beaupré est attesté en 1636, année où sept associés forment la Compagnie de Beaupré. Leur seigneurie s’étend de la rivière Montmorency à Baie-Saint-Paul et comprend l’île d’Orléans. Selon une explication répandue, des marins bretons auraient admiré la prairie de la côte en s’écriant « Oh! le beau pré ».", "Le territoire de Beaupré est longtemps partagé entre deux des plus anciennes paroisses du Québec, Sainte-Anne-de-Beaupré et Saint-Joachim. Au début du XXe siècle, le bois coupé dans l’arrière-pays descend jusqu’à un moulin à scie de l’île Labranche, à Beaupré. En 1927, Saint-Joachim cède une partie de son territoire pour former la nouvelle paroisse.", "La municipalité est érigée le 23 avril 1928 sous le nom de Notre-Dame-du-Rosaire. Comme plusieurs paroisses portaient déjà ce nom, elle devient Beaupré la même année. Elle obtient le statut de ville en 1962.", "À l’automne 1943, des skieurs bénévoles de Québec et de Beaupré ouvrent une première piste sur le mont Sainte-Anne. La station est inaugurée le 16 janvier 1966, alors propriété de la Ville de Beaupré, et le gouvernement du Québec en prend possession en 1970. L’usine de papier, qui datait de 1927, ferme en 2009."],
  portrait: ["Beaupré fait partie de la MRC de La Côte-de-Beaupré, dans la Capitale-Nationale. La ville s’étend du bord du Saint-Laurent jusqu’au mont Sainte-Anne, qui culmine à 803 m. La rivière Sainte-Anne traverse le sud-est du territoire et se jette dans le fleuve face à la pointe nord de l’île d’Orléans.", "Au recensement de 2021, Beaupré comptait 4 117 habitants. En plus de la station de ski, la ville a un parc industriel et une marina à l’embouchure de la rivière Sainte-Anne."],
  dates: [["1636", "Création de la Compagnie de Beaupré"], ["1927", "Construction de l’usine de papier"], ["1928", "Création de la municipalité"], ["1962", "Beaupré devient une ville"], ["1966", "Ouverture de la station du Mont-Sainte-Anne"]],
  wiki: "https://fr.wikipedia.org/wiki/Beaupré_(Québec)"
}, {
  s: "saint-joachim",
  n: "Saint-Joachim",
  dans: "à Saint-Joachim",
  de: "de Saint-Joachim",
  type: "ville",
  arrT: "MRC",
  arr: "La Côte-de-Beaupré",
  zone: "Rive-Nord",
  d: "À l’extrémité est de la Côte-de-Beaupré, au pied du cap Tourmente. L’avenue Royale, bordée de maisons anciennes, traverse le village et mène à la réserve nationale de faune.",
  situe: "Côte-de-Beaupré, au pied du cap Tourmente",
  chiffre: ["Locataires", "26,2 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Avenue Royale", "Église de Saint-Joachim", "Cap Tourmente"],
  vie: "Un village agricole et paisible, entre le fleuve et la montagne. Au printemps et à l’automne, des milliers d’oies des neiges font halte sur les battures du cap Tourmente.",
  log: "Surtout des maisons individuelles, dont plusieurs maisons ancestrales le long de l’avenue Royale. On trouve aussi quelques duplex et de petits immeubles.",
  pres: ["Réserve nationale de faune du Cap-Tourmente", "La Grande Ferme", "Canyon Sainte-Anne"],
  sav: "On rejoint Saint-Joachim par la route 138 Est, puis par l’avenue Royale. La Véloroute Marie-Hélène Prémont y offre une boucle familiale de 10 km, le Tour du Cap-Tourmente.",
  hist: ["Les Iroquoiens du Saint-Laurent fréquentaient le cap Tourmente, qu’ils appelaient Ajoasté. En 1626, Champlain fait bâtir au pied du cap une ferme pour nourrir la colonie de Québec. Elle est détruite par les frères Kirke en 1628.", "La Compagnie de Beaupré acquiert la seigneurie en 1636. Dans les années 1660, Mgr de Laval, fondateur du Séminaire de Québec, en devient propriétaire et y établit la Petite Ferme et la Grande Ferme. Le nom Saint-Joachim apparaît en 1684, et une première église est bâtie l’année suivante sur le site de la Grande Ferme.", "La paroisse est érigée en 1721, après son détachement de Sainte-Anne-de-Beaupré. En 1759, pendant le siège de Québec, des troupes britanniques incendient l’église et plusieurs maisons. L’église actuelle, l’une des plus anciennes conservées au Québec, est bénie le 8 juillet 1779.", "La municipalité de paroisse est établie en 1845, abolie en 1847 puis rétablie en 1855. Par la suite, Saint-Joachim cède des parties de son territoire pour créer Saint-Ferréol, Saint-Tite-des-Caps et Beaupré. En 1969, le gouvernement fédéral achète des terres du Séminaire, qui deviennent la réserve nationale de faune."],
  portrait: ["Saint-Joachim est une municipalité de paroisse de la MRC de La Côte-de-Beaupré, à l’est de Beaupré. Elle forme la limite est de la Côte-de-Beaupré, au pied du cap Tourmente, et la rivière Sainte-Anne borde son nord-ouest. C’est l’un des plus anciens lieux de colonisation au Canada.", "Au recensement de 2021, Saint-Joachim comptait 1 427 habitants. La réserve nationale de faune du Cap-Tourmente, créée en 1978, protège les marais où s’arrête la grande oie des neiges. Depuis 1981, elle est reconnue comme site d’importance internationale par la convention de Ramsar."],
  dates: [["1626", "Ferme de Champlain au cap Tourmente"], ["1684", "Première mention du nom Saint-Joachim"], ["1721", "Érection de la paroisse"], ["1779", "Bénédiction de l’église actuelle"], ["1978", "Création de la réserve nationale de faune"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Joachim_(Québec)"
}, {
  s: "saint-ferreol-les-neiges",
  n: "Saint-Ferréol-les-Neiges",
  dans: "à Saint-Ferréol-les-Neiges",
  de: "de Saint-Ferréol-les-Neiges",
  type: "ville",
  arrT: "MRC",
  arr: "La Côte-de-Beaupré",
  zone: "Rive-Nord",
  d: "Sur les contreforts est du mont Sainte-Anne, juste au nord-est de Beaupré, à environ 48 km de Québec. La rivière Sainte-Anne coule dans la partie est du territoire, où se trouvent les Sept-Chutes.",
  situe: "Côte-de-Beaupré, au pied du mont Sainte-Anne",
  chiffre: ["Locataires", "12,5 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Mont-Sainte-Anne", "Les Sept-Chutes", "Sentier Mestachibo"],
  vie: "Une municipalité familiale tournée vers le plein air, au pied d’une grande station de ski. On y pratique le ski alpin et de fond, la randonnée et le vélo de montagne.",
  log: "Surtout des maisons individuelles, avec quelques maisons jumelées. La location y est peu répandue : en 2021, environ un ménage sur huit était locataire.",
  pres: ["Centre national d’entraînement Pierre-Harvey", "Chute Jean-Larose", "Canyon Sainte-Anne"],
  sav: "Le village a une école primaire, un CPE, une épicerie et une bibliothèque. L’école secondaire, l’hôpital et le CLSC sont à quelques minutes en voiture, et Québec à une trentaine de minutes.",
  hist: ["En 1693, l’abbé Louis Soumande explore les hauteurs au nord de Saint-Joachim lors d’une expédition de chasse et y repère des terres cultivables. Ces terres font partie de la seigneurie de Beaupré, propriété du Séminaire de Québec. Les premières familles s’y établissent vers 1730, la plupart venues de l’île d’Orléans.", "Le village prend le nom de Jean Lyon de Saint-Ferréol, supérieur du Séminaire de 1726 à 1734. Une première chapelle est bénite en 1767, et une église de pierre la remplace en 1842. Le climat d’altitude rend les récoltes difficiles, mais la population augmente vite entre 1831 et 1851.", "La forêt et la rivière font ensuite vivre la paroisse. En 1916, la centrale hydroélectrique des Sept-Chutes commence à vendre de l’électricité. À partir de 1937, une dalle de 14,4 km transporte les billes de bois jusqu’au moulin de Beaupré, où travaillent de nombreux résidents.", "L’ouverture de la station du Mont-Sainte-Anne, en 1966, change la vocation du village. Le 5 novembre 1969, Saint-Ferréol devient Saint-Féréol-les-Neiges, un nom qui souligne la prospérité apportée par les skieurs. La graphie actuelle, avec deux r, est fixée en 1978."],
  portrait: ["Saint-Ferréol-les-Neiges fait partie de la MRC de La Côte-de-Beaupré, dans la Capitale-Nationale. Son territoire est arrosé par la rivière Sainte-Anne, à l’est, et par la rivière Jean-Larose, à l’ouest. Le village est voisin de Beaupré, de Saint-Joachim et de Saint-Tite-des-Caps.", "Au recensement de 2021, la municipalité comptait 3 806 habitants. La centrale des Sept-Chutes, remise en service par Hydro-Québec en 1999, produit 22 MW, et une partie des parcs éoliens de la Seigneurie de Beaupré se trouve sur son territoire."],
  dates: [["1693", "Exploration de l’abbé Louis Soumande"], ["1730", "Arrivée des premières familles"], ["1916", "Centrale des Sept-Chutes en service"], ["1966", "Ouverture de la station du Mont-Sainte-Anne"], ["1969", "Ajout de « les-Neiges » au nom"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Ferréol-les-Neiges"
}, {
  s: "saint-tite-des-caps",
  n: "Saint-Tite-des-Caps",
  dans: "à Saint-Tite-des-Caps",
  de: "de Saint-Tite-des-Caps",
  type: "ville",
  arrT: "MRC",
  arr: "La Côte-de-Beaupré",
  zone: "Rive-Nord",
  d: "Dans la région des Caps, entre le cap Tourmente et Charlevoix, à 14 km au nord-est de Saint-Joachim. La route 138 y monte par la côte de la Miche jusqu’au village, niché au creux d’un vallon.",
  situe: "Région des Caps, entre Saint-Joachim et Charlevoix",
  chiffre: ["Locataires", "22,2 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Route 138", "Église de Saint-Tite-des-Caps", "Sentier des Caps de Charlevoix"],
  vie: "Un village de montagne calme, entouré de forêts et de terres agricoles. L’été, la population augmente avec l’arrivée des villégiateurs.",
  log: "Surtout des maisons individuelles, avec quelques duplex et de petits immeubles. Le territoire compte aussi plus de 300 chalets.",
  pres: ["Mont-Sainte-Anne", "Réserve nationale de faune du Cap-Tourmente", "Baie-Saint-Paul"],
  sav: "La route 138 relie le village à Québec et à Baie-Saint-Paul, à 32 km. La route 360 (avenue Royale), qui longe la Côte-de-Beaupré, se termine aussi à Saint-Tite-des-Caps.",
  hist: ["La municipalité doit son nom à saint Tite, disciple de saint Paul. Au Québec, le mot caps désigne des rochers plus ou moins dénudés, et la région des Caps s’étend entre le cap Tourmente et Baie-Saint-Paul.", "Les premiers colons arrivent vers 1853, année où l’endroit est desservi comme mission. Un bureau de poste ouvre en 1866, et la municipalité est créée en 1872 à partir d’une partie du territoire de Saint-Joachim.", "L’église actuelle est construite en 1893, et le presbytère en 1906. Le vieux chemin qui traverse le village, longtemps appelé chemin des Caps, reliait la Côte-de-Beaupré à Charlevoix. Au XXe siècle, de nombreux habitants travaillent pour la St Anne Power Company, qui coupe le bois du bassin de la rivière Sainte-Anne à partir de 1905.", "En 1953, on construit la côte de la Miche, la section de la route 138 qui monte vers Saint-Tite-des-Caps. Le climat sec et frais attire des vacanciers l’été, et les zones de villégiature comptent aujourd’hui plus de 300 chalets."],
  portrait: ["Saint-Tite-des-Caps fait partie de la MRC de La Côte-de-Beaupré, dans la Capitale-Nationale. Son relief est accidenté et en grande partie boisé. La rivière Sainte-Anne borde le territoire, que traverse aussi la rivière Lombrette.", "Au recensement de 2021, la municipalité comptait 1 504 habitants. L’été, sa population augmente d’environ 1 000 personnes grâce à ses secteurs de villégiature."],
  dates: [["1853", "Arrivée des premiers colons"], ["1866", "Ouverture du bureau de poste"], ["1872", "Création de la municipalité"], ["1893", "Construction de l’église"], ["1953", "Construction de la côte de la Miche"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Tite-des-Caps"
}, {
  s: "neuville",
  n: "Neuville",
  dans: "à Neuville",
  de: "de Neuville",
  type: "ville",
  arrT: "MRC",
  arr: "Portneuf",
  zone: "Portneuf",
  d: "Sur la rive nord du Saint-Laurent, à environ 30 km à l’ouest du centre-ville de Québec. La route 138, le chemin du Roy, traverse la ville, et la rue des Érables forme le cœur du vieux village.",
  situe: "Portneuf, au bord du fleuve à l’ouest de Québec",
  chiffre: ["Locataires", "13,5 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Rue des Érables", "Chemin du Roy", "Église Saint-François-de-Sales"],
  vie: "Un village historique et agricole au bord du fleuve, membre de l’Association des plus beaux villages du Québec. L’été, des kiosques de maïs sucré bordent la route 138.",
  log: "Surtout des maisons individuelles, dont plusieurs maisons anciennes dans le noyau villageois. Les duplex et les petits immeubles à logements sont peu nombreux.",
  pres: ["Réserve naturelle du Marais-Léon-Provancher", "Place des Marées", "Rivière Jacques-Cartier"],
  sav: "La route 138 longe le fleuve, et la route 365 mène à l’autoroute 40, à la sortie 281. Environ 30 km séparent Neuville du centre-ville de Québec.",
  hist: ["En 1653, Jean de Lauson concède la seigneurie à Jean Bourdon pour son fils Jean-François Bourdon de Dombourg, d’où son premier nom, Dombourg. Les premiers colons s’installent à partir de 1667, et un moulin seigneurial est construit en 1668.", "En 1680, Nicolas Dupont de Neuville achète la seigneurie et lui donne son nom. Elle compte 372 habitants dès 1683. La paroisse Saint-François-de-Sales est érigée en 1684, avec Jean Basset comme premier curé, et l’endroit est aussi appelé Pointe-aux-Trembles, d’après une pointe autrefois couverte de trembles.", "De 1802 à 1830, le Bourg Saint-Louis, cœur de l’actuel village, connaît une vague de construction. Entre 1840 et 1870, les chantiers navals de Neuville construisent 65 navires à trois mâts, vendus surtout en Angleterre. Le peintre Antoine Plamondon s’installe à Neuville en 1851, et plusieurs de ses tableaux ornent l’église paroissiale.", "En 1919, le village de Neuville se détache de la paroisse de Pointe-aux-Trembles et devient une municipalité distincte. Les deux municipalités se regroupent en 1997 pour former la ville de Neuville. Depuis 1984, Neuville est jumelée avec Neuville-de-Poitou, en France."],
  portrait: ["Neuville fait partie de la MRC de Portneuf, dont elle est la porte d’entrée est. Elle est voisine de Donnacona à l’ouest, de Pont-Rouge au nord et de Saint-Augustin-de-Desmaures à l’est. Ses terres en pente vers le fleuve produisent un maïs sucré vendu dans toute la région de Québec.", "Au recensement de 2021, Neuville comptait 4 475 habitants. La rue des Érables et l’ancien noyau villageois forment un ensemble historique d’intérêt régional, avec de nombreux bâtiments anciens bien conservés."],
  dates: [["1667", "Arrivée des premiers colons"], ["1680", "La seigneurie prend le nom de Neuville"], ["1684", "Érection de la paroisse"], ["1919", "Création du village de Neuville"], ["1997", "Regroupement en ville de Neuville"]],
  wiki: "https://fr.wikipedia.org/wiki/Neuville_(Québec)"
}, {
  s: "lac-sergent",
  n: "Lac-Sergent",
  dans: "à Lac-Sergent",
  de: "de Lac-Sergent",
  type: "ville",
  arrT: "MRC",
  arr: "Portneuf",
  zone: "Portneuf",
  d: "Autour du lac Sergent, dans Portneuf, à environ 40 km de Québec et 10 km de Saint-Raymond. Le chemin du Tour-du-Lac ceinture le plan d’eau, et la route 367 longe sa partie nord.",
  situe: "Portneuf, à 10 km de Saint-Raymond",
  chiffre: ["Locataires", "4,3 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Lac Sergent", "Chapelle Notre-Dame-de-la-Paix", "Vélopiste Jacques-Cartier/Portneuf"],
  vie: "Une petite ville de villégiature tournée vers le lac. Elle a une association nautique et un club de canoë-kayak de vitesse, le Club de canotage du Lac-Sergent.",
  log: "Presque uniquement des maisons individuelles et des chalets autour du lac. Les logements à louer y sont très rares : en 2021, la quasi-totalité des ménages étaient propriétaires.",
  pres: ["Lac Saint-Joseph", "Lac Sept-Îles", "Saint-Raymond"],
  sav: "Saint-Raymond est à environ 10 km et Québec à environ 40 km. La Vélopiste Jacques-Cartier/Portneuf traverse la ville et rejoint le Corridor des Cheminots en direction de Québec.",
  hist: ["Le nom du lac est en usage avant 1829. Selon l’explication la plus répandue, il rappelle un vieux soldat qui avait le grade de sergent et vivait sur ses rives. Une autre hypothèse y voit une déformation de serre-joint, un outil de menuisier dont le lac rappellerait la forme.", "La voie ferrée entre Québec et le Lac-Saint-Jean ouvre le secteur à la villégiature. Les premiers estivants, venus surtout de Québec, arrivent en 1896 et s’installent dans la partie sud-ouest du lac, près des deux gares, Lake Sergent Station et Lake Sergent East Station.", "La chapelle Notre-Dame-de-la-Paix est bénite le 28 juin 1908, et un bureau de poste d’été ouvre en 1909. Le 25 février 1921, la ville est constituée à partir de territoires détachés de Saint-Raymond et de Sainte-Catherine-de-Fossambault.", "Les trains de voyageurs entre Québec et Saint-Raymond cessent en 1961. Le Club de canotage du Lac-Sergent est fondé en 1989. Après l’abandon de la voie ferrée, son tracé devient la Vélopiste Jacques-Cartier/Portneuf, ouverte au public en 1998."],
  portrait: ["Lac-Sergent fait partie de la MRC de Portneuf, dans la Capitale-Nationale. La ville entoure le lac Sergent, le plus petit des trois grands lacs de villégiature du secteur, avec les lacs Saint-Joseph et Sept-Îles. Le lac est entouré de montagnes boisées qui dépassent 300 m d’altitude.", "Au recensement de 2021, Lac-Sergent comptait 541 habitants. Le lac gèle normalement de novembre à avril, et ses rives comptent beaucoup de résidences et de chalets."],
  dates: [["1896", "Arrivée des premiers villégiateurs"], ["1908", "Bénédiction de la chapelle"], ["1909", "Ouverture du bureau de poste d’été"], ["1921", "Constitution de la ville"], ["1998", "Ouverture de la Vélopiste"]],
  wiki: "https://fr.wikipedia.org/wiki/Lac-Sergent"
}, {
  s: "cap-sante",
  n: "Cap-Santé",
  dans: "à Cap-Santé",
  de: "de Cap-Santé",
  type: "ville",
  arrT: "MRC",
  arr: "Portneuf",
  zone: "Portneuf",
  d: "Sur une falaise qui domine le Saint-Laurent, entre Donnacona et Portneuf, à l’embouchure de la rivière Jacques-Cartier. Le Vieux Chemin et la route 138, le chemin du Roy, traversent la ville.",
  situe: "Portneuf, sur une falaise au-dessus du fleuve",
  chiffre: ["Locataires", "11,3 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Vieux Chemin", "Église de la Sainte-Famille", "Fort Jacques-Cartier"],
  vie: "Un village patrimonial au bord du fleuve, membre de l’Association des plus beaux villages du Québec. L’Escale du Roy accueille les visiteurs et expose le travail d’artistes locaux.",
  log: "Surtout des maisons individuelles, dont plusieurs maisons du XVIIIe siècle bien conservées. Les logements locatifs sont peu nombreux : en 2021, environ un ménage sur neuf était locataire.",
  pres: ["Parc régional de l’embouchure de la Jacques-Cartier", "L’Escale du Roy", "Promenade-Fleuve"],
  sav: "Le stationnement dans les rues est interdit de 23 h à 7 h, du 15 novembre au 1er avril. La Corporation de transport régional de Portneuf met deux stationnements incitatifs à la disposition des covoitureurs à Cap-Santé.",
  hist: ["En 1636, la Compagnie des Cent-Associés promet à Jacques Le Neuf de la Poterie une concession sur les hauteurs de Cap-Santé et de Portneuf. Les premiers colons s’établissent en 1675, et le premier registre de la paroisse s’ouvre en 1679, date retenue pour la fondation.", "La seigneurie de Portneuf devient une baronnie en 1681. Une chapelle-presbytère est bâtie en 1709, puis une première église de pierre de 1716 à 1718. La construction de l’église actuelle commence en 1754.", "En 1759, les matériaux de l’église servent à bâtir le fort Jacques-Cartier, à l’embouchure de la rivière. Après la défaite des plaines d’Abraham, l’armée française y passe l’hiver, et Lévis en part au printemps 1760 pour la bataille de Sainte-Foy. Les habitants récupèrent ensuite les matériaux et terminent l’église en 1767.", "La municipalité de la paroisse de Sainte-Famille est créée en 1855. Le décor intérieur de l’église est réalisé de 1859 à 1861 par Raphaël Giroux et le plâtrier François Blouin. La municipalité prend le nom de Cap-Santé en 1979 et devient une ville en 2000."],
  portrait: ["Cap-Santé est le chef-lieu de la MRC de Portneuf, dans la Capitale-Nationale. La ville est voisine de Portneuf, de Saint-Basile, de Pont-Rouge et de Donnacona, et la rivière Jacques-Cartier marque sa limite est. Son noyau ancien, autour de l’église, occupe une terrasse boisée qui domine le fleuve.", "Au recensement de 2021, Cap-Santé comptait 3 594 habitants. Le site patrimonial de Sainte-Famille, classé en 1986, réunit l’église, le presbytère, le cimetière et un tronçon de l’ancien chemin menant au quai."],
  dates: [["1679", "Ouverture du premier registre paroissial"], ["1759", "Construction du fort Jacques-Cartier"], ["1767", "Achèvement de l’église de la Sainte-Famille"], ["1855", "Création de la municipalité de Sainte-Famille"], ["2000", "Cap-Santé devient une ville"]],
  wiki: "https://fr.wikipedia.org/wiki/Cap-Santé"
}, {
  s: "saint-basile",
  n: "Saint-Basile",
  dans: "à Saint-Basile",
  de: "de Saint-Basile",
  type: "ville",
  arrT: "MRC",
  arr: "Portneuf",
  zone: "Portneuf",
  d: "Au cœur de la MRC de Portneuf, à quelques kilomètres au sud de Saint-Raymond. La rivière Portneuf traverse le territoire, et la route 365 y passe entre Pont-Rouge et Saint-Raymond.",
  situe: "Centre de Portneuf, au sud de Saint-Raymond",
  chiffre: ["Locataires", "20,9 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Rivière Portneuf", "Route 365", "Centre Nature"],
  vie: "Une petite ville familiale entourée de terres agricoles et d’érablières, avec des secteurs industriels et commerciaux. La vie communautaire y est active, avec des fêtes populaires et une école primaire au cœur des activités.",
  log: "Surtout des maisons individuelles, avec de petits immeubles à logements et quelques duplex. En 2021, environ un ménage sur cinq était locataire.",
  pres: ["Vallée Bras-du-Nord", "Lac Sergent", "Vieux Chemin de Cap-Santé"],
  sav: "Un service de transport collectif relie Québec et Saint-Basile, et l’autoroute 40 est à une quinzaine de minutes. Les élèves du secondaire sont rattachés à l’École secondaire Louis-Jobin, à Saint-Raymond.",
  hist: ["Le territoire couvre une partie des anciennes seigneuries Jacques-Cartier, d’Auteuil et de Neuville. Des pionniers venus des paroisses riveraines du fleuve, surtout de Cap-Santé, commencent à le défricher au milieu du XIXe siècle.", "Les habitants demandent une paroisse dès 1836, et la première érection canonique a lieu le 28 février 1843. Les registres de Saint-Basile s’ouvrent le 14 janvier 1847, année considérée comme celle de la fondation. Le nom honore saint Basile le Grand, évêque de Césarée au IVe siècle.", "En 1948, une partie du territoire forme la municipalité du village de Saint-Basile-Sud. Ce village se développe autour d’une jonction ferroviaire et d’une cimenterie. Lancée à la fin des années 1940 par Gustave Papillon et son père, Ernest-J. Papillon, l’usine de Ciment Québec construit son premier four rotatif en 1951.", "Le Centre Nature est fondé en 1976 par des citoyens amateurs de ski de fond. En 2000, la municipalité de paroisse de Saint-Basile et le village de Saint-Basile-Sud se regroupent pour former la ville de Saint-Basile. En 2005, le centre communautaire prend le nom d’Ernest-J.-Papillon."],
  portrait: ["Saint-Basile fait partie de la MRC de Portneuf, dans la Capitale-Nationale. Elle est bordée par Pont-Rouge à l’est, Portneuf à l’ouest, Saint-Raymond et Sainte-Christine-d’Auvergne au nord, et Cap-Santé au sud. Son territoire de près de 98 km² est surtout agricole, avec des érablières et la rivière Portneuf, que rejoint la rivière Chaude.", "Au recensement de 2021, Saint-Basile comptait 2 709 habitants. La cimenterie Ciment Québec, fondée par la famille Papillon, est le principal acteur économique de la ville."],
  dates: [["1843", "Première érection canonique de la paroisse"], ["1847", "Ouverture des registres paroissiaux"], ["1948", "Création de Saint-Basile-Sud"], ["1951", "Premier four de la cimenterie"], ["2000", "Regroupement en ville de Saint-Basile"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Basile_(Québec)"
}, {
  s: "desjardins",
  n: "Desjardins",
  dans: "dans l’arrondissement de Desjardins",
  de: "de l’arrondissement de Desjardins",
  type: "arrondissement",
  arrT: "Arrondissement",
  arr: "Ville de Lévis",
  zone: "Rive-Sud",
  d: "Dans l’est de Lévis, face à Québec, entre la rivière Etchemin et Beaumont. Le boulevard Guillaume-Couture et la route du Président-Kennedy en sont les grands axes.",
  situe: "Est de Lévis, face à Québec",
  chiffre: ["Locataires", "34,1 %", "des ménages de la ville de Lévis étaient locataires au recensement de 2021"],
  rep: ["Quai Paquet", "Maison Alphonse-Desjardins", "Route du Président-Kennedy"],
  vie: "Le cœur urbain de Lévis, avec le Vieux-Lévis et le Vieux-Lauzon près du fleuve, des quartiers résidentiels sur le plateau et un paysage plus rural vers Pintendre.",
  log: "Des maisons anciennes et des plex dans le Vieux-Lévis et le Vieux-Lauzon, des immeubles locatifs le long de la route du Président-Kennedy et davantage de maisons unifamiliales vers Pintendre.",
  pres: ["Galeries Chagnon", "Hôtel-Dieu de Lévis", "Parc régional de la Pointe-de-la-Martinière"],
  sav: "La traverse Québec-Lévis part du quai Paquet. La Société de transport de Lévis offre aussi des trajets vers la colline Parlementaire et l’Université Laval, et la route du Président-Kennedy (route 173) relie le centre de Lévis à l’autoroute 20.",
  hist: ["En 1629, Champlain nomme l’endroit cap de Lévy, en l’honneur d’Henri de Lévis, vice-roi de la Nouvelle-France. La seigneurie de Lauzon est créée en 1636, et Guillaume Couture s’établit à la Pointe-Lévy en 1647. La mission Saint-Joseph-de-la-Pointe-de-Lévy, d’où sont issus Lauzon et Saint-Joseph, est fondée en 1679.", "À l’été 1759, les troupes britanniques s’installent à la Pointe-Lévy. Leurs canons, placés sur la falaise, bombardent Québec pendant 70 jours. Après la bataille des plaines d’Abraham, le corps du général Wolfe est déposé quelques heures dans l’église Saint-Joseph, transformée en hôpital militaire.", "La ville de Lévis est fondée le 18 mai 1861, à l’initiative du curé Joseph-David Déziel. En 1867, le village de Lauzon se détache de Saint-Joseph-de-la-Pointe-de-Lévy, et le chantier Davie s’y agrandit dans les années 1880. Entre 1865 et 1872, les Britanniques bâtissent trois forts sur les hauteurs pour protéger Québec et son port. Plus au sud, l’église Saint-Louis de Pintendre est construite en 1899, et la municipalité de Pintendre naît en 1901.", "En 1900, Alphonse Desjardins fonde à Lévis le mouvement coopératif qui porte son nom. Lévis fusionne avec Lauzon en 1989, puis avec Saint-David-de-l’Auberivière en 1990. Le 1er janvier 2002, Pintendre et Saint-Joseph-de-la-Pointe-de-Lévy se joignent à la nouvelle ville, et l’arrondissement prend le nom d’Alphonse Desjardins."],
  portrait: ["Desjardins est l’un des trois arrondissements de Lévis. Il occupe l’est de la ville, face à Québec, et la rivière Etchemin le sépare de l’arrondissement des Chutes-de-la-Chaudière-Est. Il regroupe trois secteurs : Pintendre, Saint-Joseph-de-la-Pointe-De Lévy et Lévis, qui englobe le Vieux-Lévis, Lauzon et Saint-David. Le siège social du Mouvement Desjardins, l’Hôtel-Dieu de Lévis, le Lévis Centre des congrès et le campus de Lévis de l’UQAR s’y trouvent.", "Selon la Ville de Lévis, l’arrondissement compte 64 081 personnes sur 133 km². Au sud s’étendent une zone agricole et le territoire de conservation de la Grande plée Bleue, une tourbière de 15 km². Le long du fleuve, on trouve le quai Paquet, d’où part la traverse vers Québec, et le parc régional de la Pointe-de-la-Martinière."],
  dates: [["1647", "Guillaume Couture s’établit à la Pointe-Lévy"], ["1759", "Bombardement de Québec depuis la Pointe-Lévy"], ["1861", "Fondation de la ville de Lévis"], ["1900", "Fondation du Mouvement Desjardins"], ["2002", "Création de l’arrondissement"]],
  wiki: "https://fr.wikipedia.org/wiki/Desjardins_(arrondissement)"
}, {
  s: "les-chutes-de-la-chaudiere-est",
  n: "Les Chutes-de-la-Chaudière-Est",
  dans: "dans l’arrondissement des Chutes-de-la-Chaudière-Est",
  de: "des Chutes-de-la-Chaudière-Est",
  type: "arrondissement",
  arrT: "Arrondissement",
  arr: "Ville de Lévis",
  zone: "Rive-Sud",
  d: "Au centre de Lévis, entre la rivière Chaudière et la rivière Etchemin. Saint-Romuald borde le fleuve au pied du pont de Québec, et l’avenue Taniata (route 275) mène à Saint-Jean-Chrysostome.",
  situe: "Centre de Lévis, entre la Chaudière et l’Etchemin",
  chiffre: ["Locataires", "34,1 %", "des ménages de la ville de Lévis étaient locataires au recensement de 2021"],
  rep: ["Pont de Québec", "Parc des Chutes-de-la-Chaudière", "Avenue Taniata"],
  vie: "Un arrondissement aux visages variés : un ancien secteur riverain à Saint-Romuald, un passé ferroviaire à Charny et des quartiers résidentiels bordés de boisés et de terres agricoles plus au sud.",
  log: "Des maisons anciennes près du fleuve à Saint-Romuald, de grands quartiers de maisons unifamiliales et des immeubles locatifs le long des principaux axes.",
  pres: ["Hôtel de ville de Lévis", "Centre hospitalier Paul-Gilbert", "Gare de Charny"],
  sav: "Les ponts de Québec et Pierre-Laporte sont tout près, à l’ouest de Saint-Romuald. L’autoroute 20 traverse l’arrondissement, Charny a une gare de VIA Rail et la Société de transport de Lévis dessert les quatre secteurs.",
  hist: ["Le territoire fait d’abord partie de la seigneurie de Lauzon. Avant l’érection de la paroisse, Saint-Jean-Chrysostome porte le nom de Taniata, un mot abénakis qui signifierait « là où poussent les peupliers ». La paroisse est érigée en 1828, la quatrième détachée de Saint-Joseph-de-la-Pointe-de-Lévy.", "Au XIXe siècle, le commerce du bois fait vivre le secteur. Saint-Romuald se détache de Saint-Jean-Chrysostome en 1855, et son quartier de Chaudière-Bassin se fait connaître par le bois et la construction navale. En 1859, Hans Denaston Breakey érige un moulin à scie juste en amont des chutes de la Chaudière, sur un site alors appelé Chaudière Mills.", "Le premier train de la ligne du Quebec & Richmond Railway, qui passe à Charny, circule le 13 novembre 1854. L’endroit, appelé Chaudiere Junction, devient un important nœud ferroviaire, et la paroisse de Charny est fondée en 1903. Breakeyville suit en 1909, autour du moulin de la famille Breakey. Le pont de Québec, qui part de Saint-Romuald, est inauguré en 1919.", "En 1965, Saint-Romuald fusionne avec Saint-Télesphore, et Charny ainsi que Saint-Jean-Chrysostome obtiennent le statut de ville. Le centre hospitalier Paul-Gilbert ouvre ses portes à Charny en 1987. Le 1er janvier 2002, les quatre municipalités sont fusionnées à Lévis, et l’ancien hôtel de ville de Saint-Romuald devient celui de la nouvelle ville."],
  portrait: ["Créé le 1er janvier 2002, l’arrondissement des Chutes-de-la-Chaudière-Est regroupe quatre secteurs : Charny, Sainte-Hélène-de-Breakeyville, Saint-Jean-Chrysostome et Saint-Romuald. La rivière Chaudière le borde à l’ouest et la rivière Etchemin à l’est, tandis que Saint-Romuald touche le fleuve au nord. L’hôtel de ville de Lévis se trouve à Saint-Romuald, au 2175, chemin du Fleuve.", "Selon la Ville de Lévis, l’arrondissement compte 49 845 personnes sur 120 km². On y trouve des crans rocheux, des boisés, une partie de la zone agricole et le parc des Chutes-de-la-Chaudière, où la rivière tombe de 35 mètres. Saint-Jean-Chrysostome a aussi un aéroport d’aviation civile."],
  dates: [["1828", "Paroisse de Saint-Jean-Chrysostome"], ["1854", "Premier train à Chaudiere Junction"], ["1909", "Fondation de Breakeyville"], ["1919", "Inauguration du pont de Québec"], ["2002", "Création de l’arrondissement"]],
  wiki: "https://fr.wikipedia.org/wiki/Les_Chutes-de-la-Chaudière-Est"
}, {
  s: "les-chutes-de-la-chaudiere-ouest",
  n: "Les Chutes-de-la-Chaudière-Ouest",
  dans: "dans l’arrondissement des Chutes-de-la-Chaudière-Ouest",
  de: "des Chutes-de-la-Chaudière-Ouest",
  type: "arrondissement",
  arrT: "Arrondissement",
  arr: "Ville de Lévis",
  zone: "Rive-Sud",
  d: "Dans l’ouest de Lévis, à l’ouest de la rivière Chaudière. La route des Rivières (route 116) relie ses trois secteurs, et l’est de Saint-Nicolas touche les ponts vers Québec.",
  situe: "Ouest de Lévis, à l’ouest de la rivière Chaudière",
  chiffre: ["Locataires", "34,1 %", "des ménages de la ville de Lévis étaient locataires au recensement de 2021"],
  rep: ["Pont Pierre-Laporte", "Route des Rivières", "Site du patrimoine de Saint-Nicolas"],
  vie: "Un arrondissement au paysage rural et champêtre, avec de grands quartiers résidentiels à Saint-Nicolas, plus de 20 km de rives sur le fleuve et beaucoup de terres agricoles.",
  log: "Surtout des maisons unifamiliales, dont beaucoup de bungalows à Saint-Étienne-de-Lauzon, et des projets résidentiels plus récents à Saint-Nicolas, notamment le long de la route des Rivières.",
  pres: ["Parc des Chutes-de-la-Chaudière", "Aréna Centre Bruno-Verret", "Bibliothèque Albert-Rousseau"],
  sav: "Le pont Pierre-Laporte, par l’autoroute 73, mène directement à Québec. Les routes 116 et 132 sont les grands axes, et la Société de transport de Lévis dessert les trois secteurs.",
  hist: ["Les Abénakis fréquentent les rives de la Chaudière. Ils désignent Saint-Nicolas sous le nom de Nessawakamighe, « deuxième endroit », car la mission qu’on y établit est la deuxième le long de la rivière. De 1683 à 1700, les Jésuites tiennent la mission Saint-François-de-Sales à l’embouchure de la Chaudière.", "La paroisse de Saint-Nicolas est fondée en 1694, ce qui en fait l’une des plus anciennes du Canada. Une première église y est construite en 1721. Le 12 septembre 1759, le général Wolfe s’embarque à Saint-Nicolas avec une partie de ses troupes pour se rendre aux plaines d’Abraham.", "En 1858, la paroisse de Saint-Étienne-de-Lauzon est détachée de celles de Saint-Nicolas et de Saint-Lambert. Son nom honore Étienne Baillargeon, curé de Saint-Nicolas de 1838 à 1870. Des moulins à scie s’installent au bord de la Beaurivage, et un pont relie les deux rives du village en 1917.", "La mission Saint-Rédempteur, fondée en 1915, devient une municipalité de village le 9 juin 1919, détachée de Saint-Étienne-de-Lauzon. Le pont Pierre-Laporte ouvre en 1972, et Saint-Nicolas fusionne avec Bernières en 1994. Le 1er janvier 2002, les trois municipalités sont fusionnées à Lévis."],
  portrait: ["Créé le 1er janvier 2002, l’arrondissement des Chutes-de-la-Chaudière-Ouest regroupe trois secteurs : Saint-Étienne-de-Lauzon, Saint-Nicolas et Saint-Rédempteur. Il occupe l’ouest de Lévis, à l’ouest de la rivière Chaudière, et la rivière Beaurivage coupe Saint-Étienne-de-Lauzon en deux. Saint-Nicolas compte trois grandes zones résidentielles : Bernières et le secteur des ponts à l’est, le golf Stastny au centre et le vieux village à l’ouest.", "Selon la Ville de Lévis, c’est le plus vaste des trois arrondissements, avec 191 km² et 47 656 personnes. Le paysage y est surtout rural, avec une grande zone agricole, des boisés et plus de 20 km de rives sur le fleuve. Le site du patrimoine de Saint-Nicolas, cité en 1987, réunit des maisons anciennes sur la route Marie-Victorin, dont la maison Pâquet, construite vers 1760."],
  dates: [["1694", "Fondation de la paroisse de Saint-Nicolas"], ["1759", "Wolfe s’embarque à Saint-Nicolas"], ["1858", "Paroisse de Saint-Étienne-de-Lauzon"], ["1919", "Création de Saint-Rédempteur"], ["2002", "Création de l’arrondissement"]],
  wiki: "https://fr.wikipedia.org/wiki/Les_Chutes-de-la-Chaudière-Ouest"
}, {
  s: "beaumont",
  n: "Beaumont",
  dans: "à Beaumont",
  de: "de Beaumont",
  type: "ville",
  arrT: "MRC",
  arr: "Bellechasse",
  zone: "Rive-Sud",
  d: "Village riverain de la MRC de Bellechasse, à environ 15 km à l’est de Lévis. Le chemin du Domaine, l’ancien chemin du Roi, traverse le vieux village, et la route 132 le contourne.",
  situe: "Rive-Sud, à l’est de Lévis",
  chiffre: ["Locataires", "12,5 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église Saint-Étienne", "Moulin de Vincennes", "Chemin du Domaine"],
  vie: "Un village patrimonial calme, au bord du fleuve, entouré de champs et de boisés, à environ 15 km de Lévis.",
  log: "Surtout des maisons unifamiliales : des maisons anciennes dans le vieux village et des secteurs résidentiels plus récents.",
  pres: ["Chapelle de procession Sainte-Anne", "Bibliothèque Luc-Lacourcière", "Grande plée Bleue"],
  sav: "Beaumont est à environ 15 km de Lévis. L’autoroute 20 traverse la municipalité au sud du village, et la route 279 la relie à Saint-Charles-de-Bellechasse.",
  hist: ["En 1672, l’intendant Jean Talon concède la seigneurie de Beaumont à Charles Couillard, petit-fils de Louis Hébert, et la seigneurie voisine de Vincennes à François Bissot. Les terres sont habitées depuis 1680 environ, et la paroisse de Saint-Étienne est fondée en 1692. Une première église en bois est construite en 1694.", "Le premier curé résident arrive en 1713. En 1721, l’intendant Michel Bégon ordonne de bâtir une église de pierre, ouverte au culte en 1733. Le presbytère de pierre de 1722 est le plus vieux vestige de presbytère de la Rive-Sud de Québec. Le moulin seigneurial Péan est construit en 1744 au pied de la Chute-à-Maillou.", "En juin 1759, le colonel Robert Monckton s’empare de l’église avant de marcher vers la Pointe-Lévy. Les Anglais affichent sur sa porte la proclamation du général Wolfe annonçant la chute prochaine de Québec. Selon une légende locale, leurs torches s’éteignaient d’elles-mêmes, et seule la porte de l’église brûla.", "La municipalité de paroisse est créée en 1845, abolie en 1847, puis rétablie en 1855. Vers 1950, la route 132 est construite pour contourner le village. La municipalité prend le nom de Saint-Étienne-de-Beaumont en 1969, puis celui de Beaumont en 1998."],
  portrait: ["Beaumont est une municipalité de la MRC de Bellechasse, au bord du Saint-Laurent, à environ 15 km à l’est de Lévis. C’est l’une des plus anciennes municipalités du Canada. Son territoire réunit les anciennes seigneuries de Beaumont et de Vincennes, et l’agriculture y tient une grande place. Dans le vieux village, le chemin du Domaine suit le tracé sinueux de la falaise.", "Beaumont conserve une quinzaine de maisons de style normand du XVIIIe siècle. L’église Saint-Étienne, ouverte au culte en 1733, compte parmi les plus anciennes du Québec. Deux chapelles de procession, Sainte-Anne et de la Sainte-Vierge, marquent les deux bouts du village, et le moulin de Vincennes, bâti en 1733, a été reconstruit en 2006."],
  dates: [["1672", "Concession de la seigneurie de Beaumont"], ["1692", "Fondation de la paroisse de Saint-Étienne"], ["1733", "Ouverture au culte de l’église de pierre"], ["1759", "Proclamation de Wolfe affichée à l’église"], ["1998", "La municipalité prend le nom de Beaumont"]],
  wiki: "https://fr.wikipedia.org/wiki/Beaumont_(Québec)"
}, {
  s: "saint-charles-de-bellechasse",
  n: "Saint-Charles-de-Bellechasse",
  dans: "à Saint-Charles-de-Bellechasse",
  de: "de Saint-Charles-de-Bellechasse",
  type: "ville",
  arrT: "MRC",
  arr: "Bellechasse",
  zone: "Rive-Sud",
  d: "Village de la MRC de Bellechasse, à environ 20 km au sud-est de Lévis. La rivière Boyer, le chemin de fer du CN et les routes 218 et 279 le traversent.",
  situe: "Rive-Sud, au sud-est de Lévis",
  chiffre: ["Locataires", "20,7 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église Saint-Charles-Borromée", "Rivière Boyer", "Lac Saint-Charles"],
  vie: "Un village agricole bien pourvu en services, avec ses écoles, son aréna et ses commerces, entouré de fermes, d’érablières et de vignobles.",
  log: "Surtout des maisons unifamiliales. Le village a aussi une résidence pour aînés et des logements à loyer modique.",
  pres: ["Aréna", "Bibliothèque Jacques-Labrie", "Parc riverain de la rivière Boyer"],
  sav: "Le village est à environ 20 km de Lévis, par l’autoroute 20 (sorties 337 et 341). On y trouve un centre de la petite enfance, une école primaire et une école secondaire.",
  hist: ["En 1713, Charles Couillard fils obtient une augmentation d’une lieue et demie de profondeur, à l’arrière de la seigneurie de Beaumont. Les premiers colons, installés à partir de 1717, dépendent alors de la paroisse de Beaumont. Le peuplement s’accélère à partir de 1723, car les terres y sont bonnes.", "En 1748, le seigneur Charles Couillard donne un terrain pour bâtir une église. L’année suivante, Mgr de Pontbriand érige la paroisse Saint-Charles-Borromée, détachée de Beaumont. Dans les années 1750, des familles acadiennes s’établissent dans le secteur, notamment au rang de l’Hêtrière.", "L’église actuelle est reconstruite entre 1827 et 1829 sur des plans de Thomas Baillairgé. Le chemin de fer arrive en 1854 et fait de Saint-Charles un lieu de passage pour les paroisses voisines. Le bureau de poste, ouvert en 1851 sous le nom St. Charles River Boyer, prend le nom de Saint-Charles-de-Bellechasse en 1905.", "Au début du XXe siècle, le village se sépare de la paroisse. L’électricité arrive le 23 octobre 1923, et l’aréna est construit en 1980 grâce à des souscriptions et au travail de nombreux bénévoles. En 1993, le village et la paroisse sont réunis pour former la municipalité de Saint-Charles-de-Bellechasse."],
  portrait: ["Saint-Charles-de-Bellechasse est une municipalité de la MRC de Bellechasse, à environ 20 km au sud-est de Lévis. Son nom honore saint Charles Borromée et rappelle le seigneur Charles Couillard. La rivière Boyer traverse le territoire du sud-ouest au nord-est, et on y trouve les lacs Saint-Charles et Beaumont.", "Le village compte un centre de la petite enfance, l’école primaire de l’Étincelle, l’École secondaire de Saint-Charles, un aréna et la bibliothèque Jacques-Labrie. L’économie repose sur les fermes laitières, porcines et horticoles, sur l’acériculture et sur quelques vignobles, dont Le Ricaneux et le Domaine Bel-Chas. L’hôtel de ville occupe l’ancien presbytère, construit dans les années 1740."],
  dates: [["1713", "Agrandissement de la seigneurie de Beaumont"], ["1749", "Paroisse Saint-Charles-Borromée"], ["1827", "Début de la construction de l’église"], ["1854", "Arrivée du chemin de fer"], ["1993", "Réunion du village et de la paroisse"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Charles-de-Bellechasse"
}, {
  s: "saint-michel-de-bellechasse",
  n: "Saint-Michel-de-Bellechasse",
  dans: "à Saint-Michel-de-Bellechasse",
  de: "de Saint-Michel-de-Bellechasse",
  type: "ville",
  arrT: "MRC",
  arr: "Bellechasse",
  zone: "Rive-Sud",
  d: "Village riverain de la MRC de Bellechasse, entre Beaumont et Saint-Vallier, à la hauteur de l’île d’Orléans. La route 132 le traverse, et la rivière Boyer s’y jette dans le fleuve.",
  situe: "Rive-Sud, face à l’île d’Orléans",
  chiffre: ["Locataires", "12,7 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Ensemble paroissial de Saint-Michel", "Rivière Boyer", "Port de plaisance"],
  vie: "Un village ancien et paisible au bord du fleuve, avec ses maisons de bois blanches, son port de plaisance et ses grands érables.",
  log: "Surtout des maisons unifamiliales, dont plusieurs maisons de bois anciennes dans le noyau villageois.",
  pres: ["Sanctuaire Notre-Dame-de-Lourdes", "Marais de Saint-Michel-de-Bellechasse", "Chapelle de procession"],
  sav: "La route 132 longe le fleuve à travers le village. La route 281 mène à La Durantaye, au sud, et la route 218 rejoint Saint-Charles-de-Bellechasse.",
  hist: ["En 1672, Olivier Morel de La Durantaye, capitaine du régiment de Carignan-Salières, reçoit la seigneurie qui porte son nom. Une mission y est ouverte la même année, puis la paroisse Saint-Michel est érigée en 1678. Elle compte parmi les dix premières paroisses du territoire québécois.", "Le seigneur souhaitait le nom de Saint-Laurent, mais une paroisse de l’île d’Orléans le portait déjà, et l’on retient saint Michel. La première église et le premier presbytère sont bâtis sur le site actuel entre 1712 et 1715, puis un nouveau presbytère est érigé en 1740. En 1754, on y établit un bourg pour attirer des artisans.", "Pendant le siège de Québec, en 1759, les troupes anglaises occupent Saint-Michel. La résistance des habitants se poursuit jusqu’en 1775 et a nourri plusieurs légendes orales. Jusqu’en 1842, le territoire porte le nom de Saint-Michel-de-la-Durantaye.", "La municipalité de paroisse est créée en 1845, abolie en 1847, puis rétablie en 1855. L’église actuelle est construite en 1872 sur des plans de Joseph-Ferdinand Peachy. En 1992, la municipalité prend le nom de Saint-Michel-de-Bellechasse, pour se distinguer de Saint-Michel, en Montérégie."],
  portrait: ["Saint-Michel-de-Bellechasse est une municipalité de la MRC de Bellechasse, sur la rive sud du Saint-Laurent, entre Saint-Vallier et Beaumont. La rivière Boyer coule presque au centre du territoire et se jette dans le fleuve en face de l’île d’Orléans. Le noyau villageois aligne des maisons de bois peintes en blanc, aux toits colorés et aux galeries fleuries. Ses nombreux érables lui ont valu le surnom de Village des arbres.", "Le site patrimonial de Saint-Michel-de-Bellechasse regroupe une cinquantaine de bâtiments du XVIIIe et du XIXe siècle. En son centre, l’ensemble paroissial, classé en 2022, réunit l’église de 1872, le cimetière, une grange à dîme et le presbytère de 1740, le troisième plus ancien encore debout au Québec. Le sanctuaire Notre-Dame-de-Lourdes, de 1879, se dresse sur un promontoire au bord du fleuve."],
  dates: [["1672", "Concession de la seigneurie de La Durantaye"], ["1678", "Érection de la paroisse Saint-Michel"], ["1740", "Construction du presbytère"], ["1872", "Construction de l’église actuelle"], ["2022", "Classement de l’ensemble paroissial"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Michel-de-Bellechasse"
}, {
  s: "la-durantaye",
  n: "La Durantaye",
  dans: "à La Durantaye",
  de: "de La Durantaye",
  type: "ville",
  arrT: "MRC",
  arr: "Bellechasse",
  zone: "Rive-Sud",
  d: "Petite municipalité agricole de la MRC de Bellechasse, au sud de Saint-Michel-de-Bellechasse. Le village, traversé par la route 281, s’est formé autour d’une ancienne gare.",
  situe: "Rive-Sud, au sud de Saint-Michel-de-Bellechasse",
  chiffre: ["Locataires", "16,4 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Centre multifonctionnel (ancienne église)", "Lac aux Canards", "Route 281"],
  vie: "Un village paisible, né avec le chemin de fer, entouré de fermes et de serres, avec un lac de villégiature tout près.",
  log: "Surtout des maisons unifamiliales et des fermes, avec quelques logements gérés par l’office d’habitation régional.",
  pres: ["Parc de l’Étang", "École Plein Soleil", "Bibliothèque municipale"],
  sav: "La route 281 relie le village à Saint-Michel-de-Bellechasse et à la route 132, au nord. La municipalité a un service de garde municipal.",
  hist: ["Olivier Morel de La Durantaye arrive en Nouvelle-France en 1665 comme capitaine du régiment de Carignan. En 1672, l’intendant Jean Talon lui concède la seigneurie qui porte son nom. Saint-Michel, Saint-Charles et Saint-Raphaël sont issus de cette seigneurie.", "Le village se développe autour de la petite gare de Saint-Michel-Station, avec l’arrivée du chemin de fer dans le nord de Bellechasse. Même si elle porte le nom d’une ancienne seigneurie, La Durantaye est l’une des plus jeunes municipalités de la région.", "La paroisse et la municipalité de Saint-Gabriel-Archange sont créées le 4 août 1910. La première messe est célébrée dans la gare du CN le 1er juin 1910, et une église de bois est érigée la même année. Le bureau de poste ouvre en 1911 sous le nom La Durantaye.", "En 1913, la paroisse adopte le nom de La Durantaye. L’église, citée immeuble patrimonial en 2008, a été transformée en centre multifonctionnel. Du 15 au 18 juillet 2010, le village a célébré son 100e anniversaire."],
  portrait: ["La Durantaye est une municipalité de paroisse de la MRC de Bellechasse. Elle touche Saint-Michel-de-Bellechasse au nord, Saint-Raphaël au sud-est, Saint-Charles et Saint-Gervais au sud-ouest, et Saint-Vallier au nord-est. C’est le seul village de Bellechasse né autour d’une gare, celle de Saint-Michel-Station.", "La municipalité a une vocation agricole depuis sa fondation, avec une quincaillerie coopérative, un vendeur de tracteurs, un pépiniériste et des serres de culture biologique. Sur la place publique, l’ancienne église est devenue le premier centre multifonctionnel de Bellechasse aménagé dans une église, et sa salle peut accueillir jusqu’à 200 personnes. Le lac aux Canards, autrefois appelé lac Saint-Michel, est un lieu de villégiature."],
  dates: [["1672", "Concession de la seigneurie de La Durantaye"], ["1910", "Paroisse Saint-Gabriel-Archange"], ["1911", "Ouverture du bureau de poste La Durantaye"], ["1913", "Adoption du nom La Durantaye"], ["2010", "Fêtes du 100e anniversaire"]],
  wiki: "https://fr.wikipedia.org/wiki/La_Durantaye"
}, {
  s: "saint-gervais",
  n: "Saint-Gervais",
  dans: "à Saint-Gervais",
  de: "de Saint-Gervais",
  type: "ville",
  arrT: "MRC",
  arr: "Bellechasse",
  zone: "Rive-Sud",
  d: "Municipalité agricole de la MRC de Bellechasse, à environ 25 km au sud-est de Lévis. La route 279 traverse le village et mène à Saint-Charles-de-Bellechasse.",
  situe: "Rive-Sud, au sud-est de Lévis",
  chiffre: ["Locataires", "26,0 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église de Saint-Gervais", "Chapelle de procession de Saint-Gervais", "Rivière Boyer Sud"],
  vie: "Un village agricole tranquille, attaché à ses racines acadiennes, avec une piscine municipale, un centre de conditionnement physique et des clubs actifs.",
  log: "Surtout des maisons unifamiliales. L’office municipal d’habitation gère aussi des logements à loyer modique pour les aînés et les familles.",
  pres: ["Parc historique de la Promenade-des-Sœurs", "Piscine municipale", "École Nouvelle-Cadie"],
  sav: "Saint-Gervais est à environ 25 km de Lévis. La route 279 relie le village à Saint-Charles-de-Bellechasse, puis à Beaumont.",
  hist: ["Après le Grand Dérangement de 1755, des Acadiens venus surtout de Beaubassin et de l’île Saint-Jean sont accueillis sur les terres du seigneur Michel-Jean-Hugues Péan de Livaudière, dans la paroisse de Saint-Charles-Borromée. En 1756, des terres de la Première Cadie leur sont attribuées. Des Canadiens français et quelques Britanniques les rejoignent ensuite.", "En 1779, un presbytère-chapelle est bâti sur un terrain donné par Augustin Roberge et Marie-Anne Pouliot. La paroisse ouvre en 1780, et le curé Louis-Pascal Sarault la dédie aux saints Gervais et Protais. La construction d’une église commence en 1795.", "Le noyau villageois prend forme dans la première moitié du XIXe siècle, avec des artisans, des commerçants et des notables. La paroisse est érigée canoniquement en 1832 et civilement en 1835, puis la municipalité est créée en 1845. Des religieuses enseignantes s’installent en 1859, et une nouvelle église est construite après l’incendie de 1872.", "La municipalité prend le nom de Saints-Gervais-et-Protais en 1969. Elle se joint à la MRC de Bellechasse le 1er janvier 1982. Depuis le 23 novembre 1991, elle s’appelle Saint-Gervais."],
  portrait: ["Saint-Gervais est une municipalité de la MRC de Bellechasse, à environ 25 km au sud-est de Lévis. Elle porte le nom des saints Gervais et Protais, deux martyrs fêtés le 19 juin. Le bras Saint-Michel marque sa limite nord-est, et la rivière Boyer Sud ainsi que la rivière du Moulin traversent son territoire.", "Avant l’ouverture de la paroisse, en 1780, une soixantaine de familles acadiennes vivaient dans ce qu’on appelait la Nouvelle-Cadie. Les rangs de la Première Cadie et de la Deuxième Cadie gardent leur souvenir. Le village conserve une chapelle de procession construite vers 1817, classée en 1981, et un ancien presbytère de 1873, cité en 2022."],
  dates: [["1756", "Arrivée de familles acadiennes"], ["1780", "Ouverture de la paroisse"], ["1835", "Érection civile de la paroisse"], ["1982", "Entrée dans la MRC de Bellechasse"], ["1991", "La municipalité devient Saint-Gervais"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Gervais_(Québec)"
}, {
  s: "saint-anselme",
  n: "Saint-Anselme",
  dans: "à Saint-Anselme",
  de: "de Saint-Anselme",
  type: "ville",
  arrT: "MRC",
  arr: "Bellechasse",
  zone: "Rive-Sud",
  d: "Municipalité de la MRC de Bellechasse, à environ 25 km de Lévis, traversée par la rivière Etchemin. La route 277 la relie à Saint-Henri, au nord.",
  situe: "Rive-Sud, au sud-est de Lévis",
  chiffre: ["Locataires", "27,7 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Rivière Etchemin", "Chutes Rouillard", "Cycloroute de Bellechasse"],
  vie: "Un village en croissance, à la fois agricole et industriel, avec une longue tradition coopérative et des paysages de rivière le long de l’Etchemin.",
  log: "Surtout des maisons unifamiliales, avec des jumelés et des immeubles à logements dans les nouveaux secteurs résidentiels.",
  pres: ["Église Saint-Anselme", "Aréna", "Bibliothèque Laurent-Caron"],
  sav: "La Municipalité publie sur son site une liste de logements à louer, mise à jour selon les appels des propriétaires. Le village a des écoles primaire et secondaire, une clinique médicale, une pharmacie et un marché d’alimentation.",
  hist: ["Les premiers colons arrivent vers 1780, surtout de Saint-Henri et de Saint-Gervais. Dès 1825, ils demandent leur propre paroisse, car leur église est loin. Mgr Panet l’érige en 1827 sous le patronage de saint Anselme, archevêque de Canterbury, et elle obtient son statut civil en 1835.", "La chapelle-presbytère, bâtie selon les plans de Thomas Baillairgé, est bénie en 1830. François Audet dit Lapointe construit ensuite l’église actuelle, commencée en 1846 et terminée en 1850. Vers la même époque, Siméon Larochelle lance ses moulins, sa forge et sa fonderie.", "La municipalité de paroisse est fondée en 1845, et le bureau de poste porte le nom de Saint-Anselme depuis 1848. Les voies ferrées du Quebec Central et du Canadien National s’y croisent dès 1875. En 1920, le village se détache de la paroisse pour former sa propre municipalité.", "À partir de 1940, les coopératives se multiplient : agricole en 1941, boulangerie en 1943, meunerie en 1949 et garage en 1955. Le village et la paroisse se regroupent en 1998. En 2005, Saint-Anselme fête son 175e anniversaire, et en 2012, l’ancienne voie ferrée devient une piste cyclable."],
  portrait: ["Saint-Anselme est une municipalité de la MRC de Bellechasse, à environ 25 km de Lévis et à 11 km à l’ouest de Sainte-Claire. La rivière Etchemin la traverse et forme les chutes Rouillard, bordées de marmites de géants. Le village se distingue aussi par son presbytère aux dix-huit lucarnes, bâti selon les plans de l’architecte Thomas Baillairgé.", "L’esprit coopératif y a fait naître une quinzaine de groupements à partir de 1940, dont une société coopérative agricole, une boulangerie, une meunerie et un garage. Depuis 1875, deux voies ferrées, celles du Quebec Central et du Canadien National, se croisaient au village. En 2012, elles ont fait place à la cycloroute de Bellechasse, qui traverse Saint-Anselme du nord au sud."],
  dates: [["1827", "Érection canonique de la paroisse"], ["1850", "Fin de la construction de l’église"], ["1875", "Croisement de deux chemins de fer"], ["1998", "Regroupement du village et de la paroisse"], ["2012", "La voie ferrée devient la cycloroute"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Anselme"
}, {
  s: "saint-vallier",
  n: "Saint-Vallier",
  dans: "à Saint-Vallier",
  de: "de Saint-Vallier",
  type: "ville",
  arrT: "MRC",
  arr: "Bellechasse",
  zone: "Rive-Sud",
  d: "Village de la MRC de Bellechasse, au bord du fleuve Saint-Laurent, face à l’île d’Orléans. L’avenue de l’Église, avec son église de pierre et ses maisons anciennes, en forme le cœur.",
  situe: "Rive-Sud, au bord du fleuve dans Bellechasse",
  chiffre: ["Locataires", "18,5 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église de Saint-Philippe et Saint-Jacques", "Maison du docteur Joseph-Côté", "Rivière Boyer"],
  vie: "Un village riverain membre de l’Association des plus beaux villages du Québec, entouré de terres agricoles. Une fromagerie, une boulangerie artisanale et des ateliers d’artisans animent le noyau villageois.",
  log: "Surtout des maisons unifamiliales, dont plusieurs maisons anciennes le long de l’avenue de l’Église, avec quelques duplex et petits immeubles au village.",
  pres: ["Parc du Faubourg", "Bibliothèque Marie-Joseph Corrivaux", "Salle multifonctionnelle"],
  sav: "L’autoroute 20 (sortie 356) et la route 132 desservent le village. La MRC de Bellechasse offre un transport collectif sur réservation vers Lévis, Montmagny et Sainte-Marie, surtout pour les rendez-vous médicaux.",
  hist: ["Le territoire fait d’abord partie de la seigneurie de La Durantaye, concédée à Olivier Morel de La Durantaye en 1672. Les premiers colons, des miliciens venus de l’île d’Orléans, s’y installent vers 1700. Une croix, un peu à l’ouest du village, rappelle Prisque Bélanger, considéré comme le premier colon.", "En 1714, l’évêque divise la paroisse de la seigneurie en deux, de part et d’autre de la rivière Boyer. La partie est devient la paroisse de Saint-Philippe-et-Saint-Jacques, où une première église de pierre avait été commencée en 1712. En 1720, les religieuses de l’Hôpital général de Québec prennent possession de cette partie de la seigneurie, acquise par l’entremise de Mgr de Saint-Vallier, dont elle prend le nom.", "Les religieuses administrent la seigneurie jusqu’en 1767. Marie-Josephte Corriveau, dite La Corriveau, devenue un personnage du folklore québécois, naît à Saint-Vallier en 1733. La municipalité est constituée en 1845, et le presbytère, l’un des plus beaux bâtiments du village, date de 1850.", "Une nouvelle église, bâtie en 1901, est détruite par le feu en 1931. L’église actuelle est construite en 1932 avec la pierre de l’ancienne, selon les plans de l’architecte Joseph-Aurèle Bigonesse. En 1958, le village se détache de la paroisse, puis les deux municipalités se réunissent en 1993."],
  portrait: ["Saint-Vallier s’étend sur la rive sud du Saint-Laurent, à 8 km à l’est de Saint-Michel-de-Bellechasse et en face de l’île d’Orléans. La rivière Boyer marque la limite nord-ouest du territoire avant de se jeter dans le fleuve. La rivière des Mères le traverse et se déverse dans l’anse de Bellechasse. Le village fait partie de l’Association des plus beaux villages du Québec.", "On y trouve une fromagerie, une boulangerie artisanale, des ateliers de poterie et de joaillerie ainsi qu’un chantier de bateaux de bois. La maison du docteur Joseph-Côté, un cottage de style Regency bâti vers 1850, est classée immeuble patrimonial depuis 1979. À l’automne, la chasse à l’oie blanche attire aussi des visiteurs."],
  dates: [["1714", "Paroisse créée à l’est de la rivière Boyer"], ["1720", "Seigneurie cédée aux Hospitalières"], ["1845", "Constitution de la municipalité"], ["1932", "Construction de l’église actuelle"], ["1993", "Fusion du village et de la paroisse"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Vallier_(Québec)"
}, {
  s: "honfleur",
  n: "Honfleur",
  dans: "à Honfleur",
  de: "de Honfleur",
  type: "ville",
  arrT: "MRC",
  arr: "Bellechasse",
  zone: "Rive-Sud",
  d: "Petite municipalité agricole au cœur de Bellechasse, à environ 9 km au nord-est de Saint-Anselme. Le village s’est formé au carrefour du 3e Rang Ouest et de la route de l’Église.",
  situe: "Rive-Sud, au nord-est de Saint-Anselme",
  chiffre: ["Locataires", "26,5 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église Notre-Dame-du-Bon-Conseil", "Route de l’Église", "Rivière Boyer"],
  vie: "Une petite communauté rurale tissée serré, entourée de terres agricoles. La vie locale se concentre autour de l’église, de la bibliothèque et de la salle municipale.",
  log: "Surtout des maisons unifamiliales et des fermes, avec peu d’immeubles locatifs.",
  pres: ["Salle Fleur de Lys", "Bibliothèque La Livrothèque", "Saint-Anselme"],
  sav: "Honfleur se trouve entre les routes 279 et 277, à environ 9 km de Saint-Anselme. La MRC de Bellechasse offre un transport collectif sur réservation vers Lévis, Montmagny et Sainte-Marie.",
  hist: ["Le territoire de Honfleur appartenait d’abord aux paroisses de Saint-Anselme, Saint-Gervais, Saint-Lazare et Sainte-Claire. L’idée d’y fonder une paroisse distincte remonte à la fin des années 1850. Elle divise longtemps les habitants de Bellechasse.", "En 1903, l’archevêque autorise la construction d’une église et d’un presbytère, même si la paroisse n’a pas encore de statut officiel. Le bureau de poste ouvert la même année prend le nom de Honfleur. L’église, bâtie par Elzéar Métivier, accueille sa première messe à Noël 1904.", "L’érection canonique de la paroisse Notre-Dame-du-Bon-Conseil est décrétée en 1905. Rome la confirme en 1907 et demande d’attendre la fin des oppositions avant de créer la municipalité. Celle-ci n’est constituée qu’en 1915, ce qui fait de Honfleur la plus jeune municipalité de la MRC de Bellechasse.", "La finition intérieure de l’église est terminée en 1928. Dans les années 1930, deux fromageries ouvrent et, à la fin de la décennie, les habitants exploitent 75 érablières. Une caisse populaire Desjardins s’installe en 1942, et la paroisse fête son centenaire en 2004."],
  portrait: ["Honfleur occupe une zone vallonnée du piémont appalachien, entre Saint-Gervais au nord, Saint-Lazare-de-Bellechasse au sud-est et Sainte-Claire au sud-ouest. La rivière Boyer y prend sa source. Le territoire couvre environ 51 km².", "Au recensement de 2021, Honfleur comptait 881 habitants. L’agriculture et le travail en forêt ont longtemps fait vivre la population, et la ferme de Maurice Laliberté a reçu la médaille d’or du Mérite agricole en 1962. La salle Fleur de Lys, propriété de la municipalité, peut accueillir jusqu’à 290 personnes."],
  dates: [["1903", "Ouverture du bureau de poste de Honfleur"], ["1904", "Première messe dans l’église neuve"], ["1905", "Érection canonique de la paroisse"], ["1915", "Constitution de la municipalité"], ["2004", "Centenaire de la paroisse"]],
  wiki: "https://fr.wikipedia.org/wiki/Honfleur_(Québec)"
}, {
  s: "saint-raphael",
  n: "Saint-Raphaël",
  dans: "à Saint-Raphaël",
  de: "de Saint-Raphaël",
  type: "ville",
  arrT: "MRC",
  arr: "Bellechasse",
  zone: "Rive-Sud",
  d: "Village de Bellechasse établi sur les deux rives de la rivière du Sud, à une quinzaine de kilomètres du fleuve. La route 281 le relie à l’autoroute 20 et à Saint-Michel-de-Bellechasse.",
  situe: "Rive-Sud, au sud de Saint-Vallier",
  chiffre: ["Locataires", "17,6 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église de Saint-Raphaël", "Rivière du Sud", "Centrale hydroélectrique de Saint-Raphaël"],
  vie: "Un village rural organisé autour de son église de pierre, de son presbytère et de son ancien couvent. Le Festival des Barres-à-Jack y rassemble la population.",
  log: "Surtout des maisons unifamiliales, au village et dans les rangs. Des logements à prix modique pour aînés et familles se trouvent rue Beaudoin.",
  pres: ["Bibliothèque Jeannine-Marquis-Garant", "CPE Belle Enfance", "Centre communautaire"],
  sav: "La sortie 348 de l’autoroute 20 mène au village par la route 281, et la route 228 rejoint Saint-Vallier et Montmagny. La MRC de Bellechasse offre un transport collectif sur réservation vers Lévis, Montmagny et Sainte-Marie.",
  hist: ["Après le Grand Dérangement de 1755, des familles acadiennes s’établissent à Saint-Gervais, et leurs descendants défrichent les terres du futur Saint-Raphaël. En 1839, une quarantaine de propriétaires demandent la création d’une paroisse. Une mission est ouverte, desservie par le curé de Saint-Gervais.", "L’archevêque autorise la construction de l’église en 1849. Le chantier est allongé en 1851, quand les habitants des 5e et 6e rangs de Saint-Michel se joignent à la paroisse, et l’église est bénie en 1852. La paroisse est érigée canoniquement en 1854 et reconnue civilement en 1855, l’année où naît la municipalité.", "Le nom honore l’abbé François-Raphaël Paquet, curé de Saint-Gervais et premier desservant de la mission. Le bureau de poste ouvre en 1852. En 1874, l’église est agrandie et reçoit une nouvelle façade dessinée par l’architecte Joseph-Ferdinand Peachy.", "En 1919, un incendie détruit une partie du village, à l’est de l’église. La centrale de la rivière du Sud est mise en service en 1921, l’année où le village se détache de la paroisse. Les deux municipalités fusionnent en 1993, et l’église est citée immeuble patrimonial en 2008, puis de nouveau en 2020."],
  portrait: ["Saint-Raphaël est née en 1993 de la fusion de la paroisse et du village du même nom. La rivière du Sud traverse le territoire, rejointe par la Petite rivière Sainte-Marguerite, et le Bras Saint-Michel en parcourt le nord-ouest. L’église, au 86 de la rue Principale, forme avec le presbytère, le cimetière et l’ancien couvent le noyau du village.", "Les premiers pionniers descendaient d’Acadiens, et une partie du territoire a longtemps porté le nom de Petite-Acadie. Sur la rivière du Sud, une centrale hydroélectrique mise en service en 1921 a fonctionné jusqu’en 1982. Le village accueille aussi le Centre de formation en entreprise et récupération de Bellechasse (CFER), qui reçoit des jeunes de 16 à 18 ans."],
  dates: [["1839", "Demande de fondation d’une paroisse"], ["1852", "Bénédiction de l’église"], ["1855", "Création de la municipalité de paroisse"], ["1921", "Mise en service de la centrale"], ["1993", "Fusion du village et de la paroisse"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Raphaël_(Québec)"
}, {
  s: "sainte-claire",
  n: "Sainte-Claire",
  dans: "à Sainte-Claire",
  de: "de Sainte-Claire",
  type: "ville",
  arrT: "MRC",
  arr: "Bellechasse",
  zone: "Rive-Sud",
  d: "Municipalité de Bellechasse établie de part et d’autre de la rivière Etchemin, sur la route 277. Elle est connue pour l’usine d’autocars Prevost, fondée par Eugène Prévost, natif de l’endroit.",
  situe: "Rive-Sud, dans la vallée de l’Etchemin",
  chiffre: ["Locataires", "29,0 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église de Sainte-Claire", "Rivière Etchemin", "Maison du Dr J.A.N. Chabot"],
  vie: "Un village actif, à la fois agricole et industriel, avec des fermes modernes des deux côtés de l’Etchemin. Le complexe sportif et culturel, avec son aréna, et les parcs du village animent la vie locale toute l’année.",
  log: "Des maisons unifamiliales, dont de belles maisons anciennes près de l’église, et des logements locatifs de 3 ½ à 5 ½ au village.",
  pres: ["Complexe sportif et culturel", "Parc Taschereau", "Cycloroute de Bellechasse"],
  sav: "La route 277 traverse la municipalité, et un transport interurbain de la MRC y circule du lundi au vendredi vers Lévis. Les cyclistes de la Cycloroute de Bellechasse ont un stationnement et une aire de repos rue de la Station.",
  hist: ["Le territoire fait partie de la seigneurie concédée à l’explorateur Louis Jolliet le 30 avril 1697. Restée inexploitée pendant un siècle, elle passe à Gabriel-Elzéar Taschereau, arrière-petit-fils de Jolliet, qui en devient l’unique propriétaire à la fin du XVIIIe siècle. Les premiers colons s’installent au milieu des années 1780.", "Une mission est ouverte en 1806, et une chapelle est bâtie en 1809 sur un terrain donné par le seigneur Taschereau. Le 14 avril 1824, Mgr Plessis érige la paroisse, et le gouverneur la reconnaît civilement le 13 août suivant. Sainte-Claire devient ainsi la première paroisse catholique reconnue par la Couronne britannique après la Conquête.", "L’église actuelle est construite de 1825 à 1827 par l’entrepreneur François Audet, d’après les plans de Thomas Baillairgé et de l’abbé Jérôme Demers. La municipalité de paroisse est créée en 1845, puis rétablie en 1855. En 1926, le territoire est divisé entre Sainte-Claire et la nouvelle municipalité de Louis-Joliette.", "Au cours de l’hiver 1923-1924, Eugène Prévost construit un premier autobus dans son atelier du village. Son entreprise emploie plus de 200 personnes en 1951, prend le nom de Prevost Car en 1957 et appartient aujourd’hui à Volvo. Sainte-Claire et Louis-Joliette fusionnent en 1977 pour former la municipalité actuelle."],
  portrait: ["Sainte-Claire s’étend de chaque côté de la rivière Etchemin, que rejoint la rivière des Abénaquis au hameau d’Abénakis. La municipalité touche Saint-Anselme à l’ouest et se trouve à 12 km au nord-ouest de Saint-Malachie. La route 277 et la Cycloroute de Bellechasse, longue de 74 km, traversent le territoire.", "L’économie repose sur l’agriculture et l’industrie, dont l’usine d’assemblage d’autocars Prevost, filiale de Volvo. Dans le village, la maison du Dr J.A.N. Chabot abrite un centre d’interprétation de la médecine de campagne, et celle d’Eugène Prévost une exposition sur son entreprise. Sainte-Claire a fêté ses 200 ans en 2024."],
  dates: [["1697", "Seigneurie concédée à Louis Jolliet"], ["1824", "Érection de la paroisse"], ["1827", "Fin de la construction de l’église"], ["1924", "Premier autobus d’Eugène Prévost"], ["1977", "Fusion avec Louis-Joliette"]],
  wiki: "https://fr.wikipedia.org/wiki/Sainte-Claire"
}, {
  s: "saint-lazare-de-bellechasse",
  n: "Saint-Lazare-de-Bellechasse",
  dans: "à Saint-Lazare-de-Bellechasse",
  de: "de Saint-Lazare-de-Bellechasse",
  type: "ville",
  arrT: "MRC",
  arr: "Bellechasse",
  zone: "Rive-Sud",
  d: "Chef-lieu de la MRC de Bellechasse, au centre de la région, à une trentaine de minutes de Lévis. La route 279 traverse la municipalité.",
  situe: "Rive-Sud, au centre de la MRC de Bellechasse",
  chiffre: ["Locataires", "25,9 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église Saint-Lazare", "Route 279", "Lac Chabot"],
  vie: "Un village paisible où siège l’administration de la MRC, avec une quarantaine d’entreprises. En août, le Festival de la Galette de sarrasin rassemble la population.",
  log: "Surtout des maisons unifamiliales. Le développement résidentiel Chabot, près de l’école primaire, accueille de nouvelles maisons unifamiliales et multifamiliales.",
  pres: ["Bibliothèque Biblio-Culture", "Salle des Bâtisseurs", "Lac Vert"],
  sav: "Saint-Lazare est à une trentaine de minutes de Lévis par la route 279. La MRC de Bellechasse offre un transport collectif sur réservation vers Lévis, Montmagny et Sainte-Marie.",
  hist: ["Vers 1830, des colons s’établissent dans les 5e, 6e, 7e et 9e concessions de la seigneurie de Livaudière, alors rattachées à Saint-Gervais. Trop loin de l’église, ils se réunissent chez le notaire Roy le 24 avril 1831 et demandent une nouvelle paroisse.", "Mgr Bernard-Claude Panet reconnaît la paroisse le 14 mai 1832, et la reconnaissance civile suit en 1835. Le nom honore Lazare Buteau (1749-1830), marchand de bois et major de milice à Saint-Gervais, qui avait promis de financer la construction de l’église. Sa veuve, Marguerite Marcoux, a tenu sa promesse.", "Une grande chapelle de bois sert de première église à partir de 1846, et le premier curé arrive en 1849. Le bureau de poste ouvre en 1855 et prend le nom de Saint-Lazare-de-Bellechasse en 1879. L’église actuelle, conçue par l’architecte David Ouellet, est construite en 1882.", "Plusieurs paroisses sont nées en partie du territoire de Saint-Lazare, dont Saint-Nérée, Honfleur et une partie de Saint-Damien. Un orgue Casavant est installé dans l’église en 1916. En 1994, la municipalité adopte officiellement le nom de Saint-Lazare-de-Bellechasse."],
  portrait: ["Saint-Lazare-de-Bellechasse occupe le centre de la MRC de Bellechasse, dont elle est le chef-lieu. Elle est bordée par Saint-Gervais au nord, Honfleur au nord-ouest, Sainte-Claire à l’ouest, Saint-Malachie au sud-ouest, Saint-Damien-de-Buckland au sud-est et Saint-Nérée-de-Bellechasse à l’est. La rivière des Abénaquis coule dans le sud-est du territoire.", "La municipalité couvre 90,88 km² et compte une quarantaine d’entreprises. L’agriculture, l’industrie laitière et la fabrication de portes et de fenêtres y ont longtemps dominé. Le lac Chabot, à la limite de Saint-Nérée-de-Bellechasse, est le principal plan d’eau."],
  dates: [["1831", "Requête pour une nouvelle paroisse"], ["1832", "Reconnaissance de la paroisse"], ["1849", "Arrivée du premier curé"], ["1882", "Construction de l’église actuelle"], ["1994", "Adoption du nom actuel"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Lazare-de-Bellechasse"
}, {
  s: "saint-neree-de-bellechasse",
  n: "Saint-Nérée-de-Bellechasse",
  dans: "à Saint-Nérée-de-Bellechasse",
  de: "de Saint-Nérée-de-Bellechasse",
  type: "ville",
  arrT: "MRC",
  arr: "Bellechasse",
  zone: "Rive-Sud",
  d: "Petite municipalité rurale au centre de la MRC de Bellechasse, au sud de Saint-Raphaël. Son territoire compte une dizaine de lacs, dont le lac Vert.",
  situe: "Rive-Sud, au sud de Saint-Raphaël",
  chiffre: ["Locataires", "9,9 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église de Saint-Nérée", "Lac Vert", "Observatoire Alphonse-Tardif"],
  vie: "Un milieu rural et boisé, tourné vers l’agriculture, l’acériculture et la forêt. Le lac Vert, bordé de nombreuses résidences, attire aussi des villégiateurs.",
  log: "Surtout des maisons unifamiliales et des fermes, ainsi que des résidences au bord du lac Vert.",
  pres: ["Complexe municipal", "Service de garde municipal", "Lac Chabot"],
  sav: "Le village se trouve entre Saint-Raphaël, au nord, et Saint-Damien-de-Buckland, au sud-est. La MRC de Bellechasse offre un transport collectif sur réservation vers Lévis, Montmagny et Sainte-Marie.",
  hist: ["Une mission est ouverte en 1881 à la demande d’une quarantaine de cultivateurs. Elle est desservie jusqu’en 1883 par l’abbé Joseph-Nérée Gingras, curé de Saint-Gervais, dont la paroisse porte le nom. Une chapelle-presbytère en bois est alors construite.", "Le curé Joseph Élie dit Breton arrive à la fin de 1883 et dirige la construction d’une église en pierre des champs, selon les plans de Georges-Émile Tanguay. Il fait aussi bâtir un moulin à scie près de l’église en 1884. La paroisse est érigée canoniquement en 1886, et la municipalité est constituée en 1887.", "Les religieuses de Notre-Dame du Perpétuel Secours enseignent à Saint-Nérée à partir de 1896, pendant plus de quatre-vingts ans. Le chemin de fer fait naître le hameau de Saint-Nérée-Station, d’où l’on expédie du bois et des sapins de Noël dans les années 1930. Une ferme expérimentale est fondée en 1938.", "En 1953, un incendie détruit une partie du village, et un nouveau couvent est construit la même année. L’observatoire Alphonse-Tardif s’installe au Lac-Vert en 1974. En 2012, la municipalité de paroisse de Saint-Nérée devient la municipalité de Saint-Nérée-de-Bellechasse."],
  portrait: ["Saint-Nérée-de-Bellechasse occupe le centre de la MRC de Bellechasse, à 23 km au sud de Saint-Vallier. Elle est entourée de Saint-Raphaël au nord, de Saint-Gervais à l’ouest et d’Armagh à l’est. Les lacs Chabot, André, Pierre-Paul et à Achille sont ses principaux plans d’eau, et la rivière des Abénaquis prend sa source dans le sud du territoire.", "Le hameau du Lac-Vert, au bord d’un lac d’environ 33 ha, accueille depuis 1974 l’observatoire Alphonse-Tardif du Collège de Lévis. L’économie locale repose sur l’agriculture, l’acériculture et le travail en forêt."],
  dates: [["1881", "Ouverture de la mission"], ["1886", "Érection canonique de la paroisse"], ["1887", "Constitution de la municipalité"], ["1974", "Arrivée de l’observatoire au Lac-Vert"], ["2012", "Adoption du nom actuel"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Nérée-de-Bellechasse"
}, {
  s: "saint-damien-de-buckland",
  n: "Saint-Damien-de-Buckland",
  dans: "à Saint-Damien-de-Buckland",
  de: "de Saint-Damien-de-Buckland",
  type: "ville",
  arrT: "MRC",
  arr: "Bellechasse",
  zone: "Rive-Sud",
  d: "Pôle industriel et commercial du sud de Bellechasse, traversé par la rivière aux Billots. La rue Commerciale réunit l’église, le bureau municipal et la maison généralice des Sœurs de Notre-Dame du Perpétuel Secours.",
  situe: "Rive-Sud, dans le sud de Bellechasse",
  chiffre: ["Locataires", "27,1 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Rue Commerciale", "Chapelle Sainte-Anne-des-Montagnes", "Parc des Bâtisseurs"],
  vie: "Un gros village aux allures de petite ville, avec clinique médicale, écoles primaire et secondaire et une vie culturelle animée par la Maison de la Culture de Bellechasse.",
  log: "Surtout des maisons unifamiliales, avec des logements à prix modique gérés par l’Office d’habitation Montmagny-Bellechasse. La municipalité prépare la deuxième phase d’un développement résidentiel.",
  pres: ["Maison de la Culture de Bellechasse", "Parc des Sœurs", "Clinique médicale"],
  sav: "Saint-Damien compte une clinique médicale, deux installations de CPE et une école secondaire. La route 279 traverse la municipalité, et la MRC offre un transport collectif sur réservation vers Lévis, Montmagny et Sainte-Marie.",
  hist: ["Des colons venus des paroisses voisines s’installent à la fin des années 1840 dans les cantons de Buckland et de Mailloux. La municipalité des cantons unis de Buckland-et-Mailloux est créée en 1859. Le canton de Buckland, proclamé en 1806, porte le nom d’une localité d’Angleterre.", "L’abbé Joseph-Onésime Brousseau fonde la paroisse en 1882 et bâtit, à l’automne, une petite sacristie qui lui sert aussi de logis. L’église est construite en 1883-1884 par Elzéar Métivier. Pendant le chantier, un feu éclate dans le clocher, et le curé promet un lieu de pèlerinage à sainte Anne si l’église est épargnée.", "En 1892, le curé Brousseau et Virginie Fournier fondent la congrégation des Sœurs de Notre-Dame du Perpétuel Secours. En 1905, un incendie détruit la plupart de leurs installations, et la maison généralice est reconstruite de 1906 à 1910. La chapelle Sainte-Anne-des-Montagnes, détruite par le même feu, est rebâtie et devient un lieu de pèlerinage.", "En 1939, Joseph-Émile Métivier lance l’entreprise qui deviendra Les Industries Provinciales Ltée (IPL), un grand nom de la plasturgie. Les religieuses ouvrent une école normale au début des années 1940 et partent pour la République dominicaine en 1948, début de leur expansion à l’étranger. Le Parc des Bâtisseurs est aménagé à partir de 2014."],
  portrait: ["Saint-Damien-de-Buckland, souvent appelée Saint-Damien, se trouve dans les montagnes du sud de Bellechasse, à l’est de Saint-Lazare-de-Bellechasse et au sud-ouest d’Armagh. La rivière aux Billots traverse le village et rejoint la rivière des Abénaquis à la limite sud-ouest. Le Parc des Bâtisseurs, un corridor boisé de 1 km, traverse le cœur du village.", "La municipalité abrite la maison généralice des Sœurs de Notre-Dame du Perpétuel Secours, une congrégation qui a essaimé dans onze pays à partir de 1948. La plasturgie y fournit de nombreux emplois. Avec l’ouverture d’une deuxième installation de CPE en 2025, Saint-Damien compte 130 places subventionnées en garderie."],
  dates: [["1859", "Création de Buckland-et-Mailloux"], ["1882", "Fondation de la paroisse"], ["1884", "Fin de la construction de l’église"], ["1892", "Fondation des Sœurs du Perpétuel Secours"], ["1939", "Début de l’entreprise qui deviendra IPL"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Damien-de-Buckland"
}, {
  s: "saint-malachie",
  n: "Saint-Malachie",
  dans: "à Saint-Malachie",
  de: "de Saint-Malachie",
  type: "ville",
  arrT: "MRC",
  arr: "Bellechasse",
  zone: "Rive-Sud",
  d: "Municipalité des collines appalachiennes de Bellechasse, au sud de Sainte-Claire, dans la vallée de la rivière Etchemin. L’avenue Principale traverse le village, perché sur une colline.",
  situe: "Rive-Sud, au sud de Sainte-Claire",
  chiffre: ["Locataires", "12,9 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église de Saint-Malachie", "Rivière Etchemin", "Mont Kinsella"],
  vie: "Un village rural marqué par ses origines irlandaises et écossaises, entouré de fermes et de forêts. La chasse, la pêche à la truite et la randonnée attirent les amateurs de plein air.",
  log: "Surtout des maisons unifamiliales et des fermes, avec quelques duplex et petits immeubles au village.",
  pres: ["Parc des Cheminots", "Bibliothèque municipale J.-A. Kirouac", "Parc municipal Frank Lafontaine"],
  sav: "La route 277 traverse le village, et un transport interurbain de la MRC y circule du lundi au vendredi vers Lévis. Le Parc des Cheminots est le point central de la Cycloroute de Bellechasse.",
  hist: ["Après la guerre de 1812, des soldats anglais reçoivent des terres dans l’est du canton de Frampton, alors appelé East Frampton. Ils les revendent à Gilbert Henderson (1785-1876), qui les concède à des immigrants irlandais. Le secteur compte quelques habitants en 1823.", "La mission de Saint-Malachie-de-Frampton ouvre en 1841, et une chapelle est construite en 1845. Comme la plupart des pionniers venaient d’Armagh, en Irlande, la mission prend pour patron saint Malachie, archevêque de cette ville au XIIe siècle. Les anglicans ont aussi leur église, Saint-Paul, bâtie sur un terrain donné par William Henderson.", "À partir de 1871, des familles canadiennes-françaises s’installent à la place des Irlandais et deviennent majoritaires. La paroisse est érigée canoniquement en 1873, et la municipalité est créée en 1874. Une invasion de crapauds survenue en 1873 aurait donné aux lieux le surnom de La Crapaudière.", "L’église actuelle est construite en 1896-1897 par Elzéar Métivier et ses fils, d’après les plans de l’architecte David Ouellet. Une statue de saint Malachie attribuée à Louis Jobin en orne la façade depuis 1897. Le nom de la municipalité est abrégé en Saint-Malachie en 1948, et l’église est citée immeuble patrimonial en 2024."],
  portrait: ["Saint-Malachie s’étend dans les collines des Appalaches, de part et d’autre de la rivière Etchemin. Les rivières Desbarats, Pyke et Henderson s’y jettent dans l’Etchemin, et les lacs des Cèdres et Dion baignent le territoire. Le mont Kinsella et la côte de la Crapaudière offrent des vues sur la vallée.", "Un sentier pédestre de 27,3 km parcourt le territoire, et le Parc des Cheminots est le point central de la Cycloroute de Bellechasse. Le Domaine du lac des Cèdres offre l’hébergement et la pêche à la truite mouchetée. L’agriculture, surtout les productions laitière, avicole et porcine, reste l’activité dominante."],
  dates: [["1841", "Ouverture de la mission"], ["1873", "Érection canonique de la paroisse"], ["1874", "Création de la municipalité"], ["1897", "Fin de la construction de l’église"], ["1948", "Adoption du nom Saint-Malachie"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Malachie"
}, {
  s: "armagh",
  n: "Armagh",
  dans: "à Armagh",
  de: "d’Armagh",
  type: "ville",
  arrT: "MRC",
  arr: "Bellechasse",
  zone: "Rive-Sud",
  d: "Municipalité des Appalaches, la plus étendue de la MRC de Bellechasse. La route 281 traverse le village, et le Parc des Chutes d’Armagh borde la rivière du même nom.",
  situe: "Rive-Sud, dans les Appalaches de Bellechasse",
  chiffre: ["Locataires", "19,6 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Parc des Chutes d’Armagh", "Église Saint-Cajetan", "Route 281"],
  vie: "Un milieu rural au relief accidenté, entouré de forêts et de fermes. Le Parc des Chutes et la Cycloroute de Bellechasse attirent cyclistes, randonneurs et motoneigistes.",
  log: "Surtout des maisons unifamiliales et des fermes. Plusieurs bâtiments anciens sont conservés le long de la rue Principale, au centre du village.",
  pres: ["Terrain des loisirs", "Musée de la Gare", "Cycloroute de Bellechasse"],
  sav: "La route 281 relie Armagh à Saint-Raphaël et à l’autoroute 20, au nord. L’accès au Parc des Chutes est gratuit pour les résidents, et la MRC offre un transport collectif sur réservation vers Lévis, Montmagny et Sainte-Marie.",
  hist: ["Le canton d’Armagh est créé en 1799 et porte le nom d’un comté de l’Ulster, en Irlande du Nord. Malgré ce nom, les premiers résidents ne sont pas irlandais. Charles Turgeon, originaire de Saint-Vallier, s’y installe vers 1838, et d’autres colons arrivent de Saint-Vallier, Saint-Michel et Saint-Raphaël.", "En 1857, les habitants obtiennent la permission de bâtir une chapelle en bois, et un premier missionnaire ouvre les registres. Une première église suit, puis la paroisse de Saint-Cajetan-d’Armagh est érigée canoniquement en 1882. Son patron, saint Cajetan, ou Gaétan de Thiene, a fondé l’ordre des Théatins au XVIe siècle.", "La fabrication du fromage compte longtemps parmi les principales activités. Sur la rivière Armagh, la Compagnie électrique d’Armagh bâtit un barrage en 1919, et sa centrale fonctionne jusqu’en 1942. L’église actuelle, une imposante construction en pierre de taille, est bâtie en 1933-1934.", "En 1950, le village d’Armagh se détache de la paroisse pour former sa propre municipalité. Les deux entités fusionnent le 29 décembre 1993 pour créer la municipalité d’Armagh. L’ancienne gare Langlois, de 1916, est déménagée au Parc des Chutes en 2014 et devient le musée de la Gare en 2016."],
  portrait: ["Armagh a le plus grand territoire de la MRC de Bellechasse. Elle touche Saint-Raphaël au nord-ouest, Saint-Damien-de-Buckland au sud-ouest et Saint-Philémon au sud-est. La rivière de la Fourche y rejoint la rivière du Sud, au sud-est du village, et la rivière Armagh descend du bassin du Massif du Sud.", "Au Parc des Chutes d’Armagh, 5 km de sentiers longent la rivière, et un viaduc de 70 m de long l’enjambe. Le parc abrite le musée de la Gare, installé dans une gare de 1916, et les vestiges d’une centrale hydroélectrique. Il marque l’une des extrémités de la Cycloroute de Bellechasse, longue de 74 km."],
  dates: [["1799", "Création du canton d’Armagh"], ["1857", "Construction de la première chapelle"], ["1882", "Érection canonique de la paroisse"], ["1934", "Fin de la construction de l’église"], ["1993", "Fusion du village et de la paroisse"]],
  wiki: "https://fr.wikipedia.org/wiki/Armagh_(Québec)"
}, {
  s: "saint-isidore",
  n: "Saint-Isidore",
  dans: "à Saint-Isidore",
  de: "de Saint-Isidore",
  type: "ville",
  arrT: "MRC",
  arr: "La Nouvelle-Beauce",
  zone: "Rive-Sud",
  d: "Municipalité agricole de La Nouvelle-Beauce, à une quinzaine de kilomètres au sud de Lévis. La route du Président-Kennedy (route 173) et la route Coulombe (route 275) se croisent sur son territoire.",
  situe: "Rive-Sud, au sud de Lévis",
  chiffre: ["Locataires", "19,1 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église de Saint-Isidore", "Route du Président-Kennedy", "Piste cyclable Monk"],
  vie: "Un milieu rural proche de Lévis, entouré de terres agricoles, avec un aréna et des parcs qui animent le village en toute saison.",
  log: "Surtout des maisons unifamiliales, avec quelques plex et petits immeubles près du village. La municipalité a aussi un secteur de développement résidentiel.",
  pres: ["Aréna et parc de l’aréna", "Bibliothèque Laurette-Nadeau-Parent", "Parc Brochu-Châtigny"],
  sav: "L’autoroute Robert-Cliche (A-73) passe dans l’ouest de la municipalité, à 5 km du village. Lévis est à une quinzaine de kilomètres au nord.",
  hist: ["Le territoire fait d’abord partie de la seigneurie de Lauzon, concédée en 1636. La route Justinienne, qui relie les seigneuries de Lauzon et de Joliet, ouvre ce coin de forêt à la colonisation. En 1789, Nicolas Hamann et sa famille s’installent en bordure de cette route et défrichent la première terre.", "Le véritable peuplement commence vers 1801, avec des familles venues de l’île d’Orléans, de la Côte-de-Beaupré et des seigneuries de Lauzon et de Bellechasse. En 1829, l’évêque Bernard-Claude Panet érige canoniquement la paroisse de Saint-Isidore-de-Lauzon. Le nom honore saint Isidore de Séville, évêque espagnol mort en 636.", "L’église actuelle est construite de 1853 à 1856. Elle reprend le plan et le décor intérieur de l’église de Saint-Anselme, dessinée par Thomas Baillairgé, et elle est classée immeuble patrimonial depuis 1957. La municipalité de paroisse est créée en 1855.", "En 1921, le village se détache de la paroisse. Une petite gare du Quebec Central, appelée Le Bras, sert de 1921 à 1967. Jadis, on surnommait l’endroit la Porte de la Beauce, car on entrait en Beauce à Saint-Isidore en venant de Lévis ou de Québec. Le village et la paroisse se réunissent en 1993 pour former la municipalité actuelle."],
  portrait: ["Saint-Isidore occupe l’extrémité nord-ouest de la MRC de La Nouvelle-Beauce, entre les rivières Chaudière et Etchemin. Elle touche Saint-Henri au nord, Saint-Lambert-de-Lauzon à l’ouest et Saint-Anselme à l’est. La rivière Chaudière forme sa limite ouest, et le terrain monte doucement vers le sud-est, d’environ 110 à 190 mètres d’altitude.", "Le territoire couvre 102,66 km², surtout en terres agricoles, où l’on élève notamment des porcs et des vaches laitières. Un aréna construit en 1978, qui abrite aussi des salles et les bureaux municipaux, est au centre des loisirs. La piste cyclable Monk, terminée en 2022, suit sur 4 km l’ancienne emprise ferroviaire de la subdivision Monk."],
  dates: [["1789", "Nicolas Hamann défriche la première terre"], ["1829", "Érection canonique de la paroisse"], ["1853", "Début de la construction de l’église"], ["1921", "Le village se détache de la paroisse"], ["1993", "Fusion du village et de la paroisse"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Isidore_(La_Nouvelle-Beauce)"
}, {
  s: "sainte-henedine",
  n: "Sainte-Hénédine",
  dans: "à Sainte-Hénédine",
  de: "de Sainte-Hénédine",
  type: "ville",
  arrT: "MRC",
  arr: "La Nouvelle-Beauce",
  zone: "Rive-Sud",
  d: "Village agricole de La Nouvelle-Beauce, à mi-chemin entre les rivières Chaudière et Etchemin. La route 275 le traverse, et l’église de 1912, avec ses deux clochers, se dresse au centre du village.",
  situe: "Rive-Sud, au sud de Lévis",
  chiffre: ["Locataires", "15,6 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église Sainte-Hénédine", "Route 275", "Rivière Le Bras"],
  vie: "Un village tranquille, entouré de fermes laitières et porcines, où la vie communautaire se rassemble autour de l’église, de l’école et des loisirs.",
  log: "Surtout des maisons unifamiliales et des fermes. Le village compte aussi quelques plex et des logements locatifs neufs.",
  pres: ["Bibliothèque La Détente", "École La Découverte", "Piste cyclable municipale"],
  sav: "La route 275 relie le village à Saint-Isidore, où passe l’autoroute Robert-Cliche (A-73). Un service de transport collectif est offert aux résidents.",
  hist: ["Le territoire fait partie des seigneuries Sainte-Marie et Jolliet, propriétés de la famille Taschereau. Les premiers colons, venus de Sainte-Marie, de Saint-Henri, de Saint-Gervais et de Sainte-Claire, s’établissent le long de la route Sainte-Thérèse, que les Taschereau avaient tracée pour peupler l’arrière-pays.", "Vers 1850, environ un millier de personnes y vivent et demandent leur propre paroisse. L’archevêque Pierre-Flavien Turgeon l’érige canoniquement le 20 mars 1852, à même des parties de Sainte-Marguerite, de Sainte-Claire et de Sainte-Marie. Le nom rend hommage à Catherine-Hénédine Dionne, veuve du seigneur Pierre-Elzéar Taschereau, qui a contribué à la construction de l’église. La municipalité de paroisse est créée en 1855.", "Le chemin de fer Lévis et Kennebec traverse la paroisse dans les années 1870, et la gare reste ouverte jusque vers 1965. En 1893, Joseph Mercier construit un premier aqueduc aux tuyaux de bois, qui dessert le village jusqu’en 1967.", "Le 1er octobre 1910, la foudre incendie la première église, alors que la nouvelle est déjà en construction. L’église actuelle, de style roman, est bénite en 1912. L’électricité arrive au village en 1925, et une ligne d’autobus relie la paroisse à Lévis et à Québec par la route 275 à partir de 1933."],
  portrait: ["Sainte-Hénédine est une municipalité de paroisse de la MRC de La Nouvelle-Beauce, entre la rivière Chaudière, à l’ouest, et la rivière Etchemin, à l’est. Elle est voisine de Saint-Isidore et à 14 km de Saint-Anselme. La rivière Le Bras, un affluent de l’Etchemin, traverse le territoire, et la route 275 passe par le village.", "L’agriculture domine, avec plusieurs éleveurs de porcs et producteurs laitiers. La population dépasse 1 000 habitants depuis environ un siècle et demi. Le site de l’église, avec son presbytère de 1940 et son cimetière aménagé en 1885, est cité site patrimonial par la municipalité."],
  dates: [["1852", "Érection canonique de la paroisse"], ["1855", "Création de la municipalité de paroisse"], ["1893", "Premier aqueduc, aux tuyaux de bois"], ["1912", "Bénédiction de l’église actuelle"], ["1925", "Arrivée de l’électricité au village"]],
  wiki: "https://fr.wikipedia.org/wiki/Sainte-Hénédine"
}, {
  s: "saint-bernard",
  n: "Saint-Bernard",
  dans: "à Saint-Bernard",
  de: "de Saint-Bernard",
  type: "ville",
  arrT: "MRC",
  arr: "La Nouvelle-Beauce",
  zone: "Rive-Sud",
  d: "Municipalité agricole de La Nouvelle-Beauce, à environ 35 km au sud de Québec. La route 171 y longe la rivière Chaudière, qui borde le territoire au sud-est.",
  situe: "Rive-Sud, au sud de Québec",
  chiffre: ["Locataires", "21,0 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église de Saint-Bernard", "Rivière Chaudière", "Route 171"],
  vie: "Une communauté agricole et familiale, avec plusieurs parcs et sentiers, et une vie de chalet l’été au bord de la Chaudière.",
  log: "Surtout des maisons unifamiliales, avec quelques duplex et petits immeubles au village. On trouve aussi des chalets le long de la Chaudière.",
  pres: ["Halte de la Chaudière", "Sentier du Moulin", "Boisé du Cap"],
  sav: "La route 171 relie Saint-Bernard à Saint-Lambert-de-Lauzon et à Lévis au nord, et à Scott au sud. Le village est à environ 35 km de Québec.",
  hist: ["En 1697, le territoire fait partie d’une seigneurie concédée aux Jésuites pour l’usage des Abénaquis, le long de la Chaudière. En 1737, il est concédé à François-Étienne Cugnet sous le nom de seigneurie Saint-Étienne, mise en valeur à partir de 1742.", "En mai 1800, le seigneur Taschereau cède des terrains pour l’église, le presbytère et le cimetière d’une future paroisse. Une première requête pour fonder la paroisse est adressée à Mgr Panet en 1821. Le nom honore Bernard-Claude Panet, coadjuteur de Mgr Plessis au moment où l’érection de la paroisse est projetée.", "Le site de l’église est fixé en 1844. Le premier curé, l’abbé André-Amable Marcoux, arrive le 1er octobre 1844, et les premiers baptêmes ont lieu le 20 octobre. La paroisse est érigée canoniquement en 1849, puis civilement en 1854.", "L’église actuelle, en pierre, est construite de 1871 à 1873. L’église et le presbytère sont classés monuments historiques depuis 1960. En 1959, le village se détache de la paroisse, et les deux se réunissent en 1987 pour former la municipalité actuelle."],
  portrait: ["Saint-Bernard est située dans la plaine du Saint-Laurent, à environ 35 km au sud de Québec. La rivière Chaudière délimite le sud-est de la municipalité sur une vingtaine de kilomètres, et la route panoramique 171 la longe entre Saint-Lambert-de-Lauzon et Scott. La rivière des Îles Brûlées traverse le territoire du sud au nord, et le relief est plutôt plat.", "L’agriculture occupe 99 % du territoire, surtout la production laitière et porcine. Le village compte une école primaire, un CPE et plusieurs parcs, dont le parc du Faubourg et le Récré-O-Parc. Au Boisé du Cap, près de 1,5 km de sentiers mènent à une tour d’observation sur le village."],
  dates: [["1737", "Concession de la seigneurie Saint-Étienne"], ["1844", "Arrivée du premier curé"], ["1873", "Fin de la construction de l’église"], ["1960", "Église et presbytère classés"], ["1987", "Fusion du village et de la paroisse"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Bernard_(Québec)"
}, {
  s: "scott",
  n: "Scott",
  dans: "à Scott",
  de: "de Scott",
  type: "ville",
  arrT: "MRC",
  arr: "La Nouvelle-Beauce",
  zone: "Rive-Sud",
  d: "Municipalité de La Nouvelle-Beauce établie sur les deux rives de la rivière Chaudière, à environ 35 km de Québec. L’autoroute Robert-Cliche (A-73) et la route du Président-Kennedy (route 173) la desservent.",
  situe: "Rive-Sud, au sud de Lévis",
  chiffre: ["Locataires", "19,3 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Rivière Chaudière", "Route du Président-Kennedy", "Centre de loisirs Atkinson"],
  vie: "Un milieu de vie familial au bord de la Chaudière, avec des parcs de quartier, une piscine municipale et un centre de loisirs.",
  log: "Surtout des maisons unifamiliales, avec quelques duplex et petits immeubles près du centre.",
  pres: ["Piscine municipale", "Parc du Torrent", "Parcours Vitalité Desjardins"],
  sav: "L’autoroute 73 et la route 173 mènent à Lévis et à Québec, à environ 35 km. La route 171 part de Scott et longe la Chaudière vers Saint-Bernard et Lévis.",
  hist: ["Le territoire fait partie de la seigneurie Jolliet. Ses droits seigneuriaux passent aux familles Taschereau et Fortier, qui donneront plus tard leur nom à la municipalité de Taschereau-Fortier. Sur le plan religieux, le secteur relève d’abord de la paroisse de Sainte-Claire, créée en 1824.", "Le chemin de fer Lévis and Kennebec, construit par Charles Armstrong Scott et Louis-Napoléon Larochelle, atteint Scott Jonction le 20 juin 1875. Après le rachat de la ligne par le Quebec Central en 1881, un pont est bâti sur la Chaudière pour la relier au réseau venant de Sherbrooke. La gare de Scott-Jonction donne son nom au village.", "La mission de Saint-Maxime est fondée en 1882 et devient une paroisse en 1895, détachée de Sainte-Marie, de Saint-Isidore et de Saint-Bernard. Le nom honore l’abbé Maxime Fillion, premier prêtre originaire de l’endroit. Une scierie ouvre en 1879, et une briqueterie fonctionne de 1895 à 1980.", "Taschereau-Fortier, le secteur rural, se détache de Saint-Maxime en 1933. En 1978, la paroisse de Saint-Maxime devient la municipalité du village de Scott. Les deux municipalités fusionnent le 29 mars 1995 pour former la municipalité de Scott."],
  portrait: ["Scott se trouve sur la rive sud du Saint-Laurent, à environ 35 km de Québec, dans la MRC de La Nouvelle-Beauce. Elle a pour voisines Saint-Isidore, Sainte-Hénédine, Saint-Bernard et Sainte-Marie. Son territoire s’étend sur les deux rives de la rivière Chaudière, que le pont de Scott franchit près de la route 173.", "En 1951, Saint-Maxime-de-Scott comptait 571 habitants et Taschereau-Fortier, 383. La municipalité regroupe aujourd’hui près de 3 000 habitants. Les loisirs se concentrent autour du Centre de loisirs Atkinson, près de la piscine municipale et du parc de la 6e Rue."],
  dates: [["1875", "Le chemin de fer atteint Scott Jonction"], ["1882", "Fondation de la mission de Saint-Maxime"], ["1933", "Création de Taschereau-Fortier"], ["1978", "Saint-Maxime devient le village de Scott"], ["1995", "Fusion avec Taschereau-Fortier"]],
  wiki: "https://fr.wikipedia.org/wiki/Scott_(Québec)"
}, {
  s: "sainte-marguerite",
  n: "Sainte-Marguerite",
  dans: "à Sainte-Marguerite",
  de: "de Sainte-Marguerite",
  type: "ville",
  arrT: "MRC",
  arr: "La Nouvelle-Beauce",
  zone: "Rive-Sud",
  d: "Village agricole de La Nouvelle-Beauce, à 12 km au nord de Sainte-Marie. Les routes 216 et 275 se croisent sur son territoire.",
  situe: "Rive-Sud, au nord de Sainte-Marie",
  chiffre: ["Locataires", "26,3 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église de Sainte-Marguerite", "Route 275", "Rivière Chassé"],
  vie: "Un milieu rural paisible, où presque tout le territoire est en zone agricole, avec des loisirs actifs et un festival chaque printemps.",
  log: "Surtout des maisons unifamiliales et des fermes, avec quelques duplex et petits immeubles au village. De nouvelles maisons s’y construisent avec la croissance de la population.",
  pres: ["Bibliothèque La Bouquine", "Skate parc et terrains sportifs", "Sainte-Marie, à 12 km"],
  sav: "Sainte-Marie et ses services sont à 12 km au sud, et Québec à environ 45 km. Les routes 216 et 275 relient le village aux municipalités voisines.",
  hist: ["Les premiers colons arrivent vers 1820, pour la plupart de Beaumont. Joseph Lacasse dit José est le premier à s’y établir. Il coupe le cèdre de sa terre pour en faire du bardeau, qu’il va vendre à Québec à pied. Quelques familles irlandaises s’installent aussi avant 1840.", "En 1830, Marguerite Marcoux, veuve de Lazare Buteau, ancien major de milice de Saint-Gervais, donne un terrain à la fabrique. L’acte précise que la paroisse sera placée sous le nom de Sainte-Marguerite. L’évêque Bernard-Claude Panet l’érige canoniquement le 8 novembre 1831, sous le patronage de sainte Marguerite d’Écosse.", "La paroisse est érigée civilement en 1837. Une première municipalité, Sainte-Marguerite-de-Joliette, est créée en 1845 et disparaît en 1847. La municipalité de paroisse actuelle voit le jour le 1er juillet 1855. Le nom Joliette évoquait Louis Jolliet, à qui la seigneurie voisine avait été concédée en 1697.", "L’église actuelle est construite de 1861 à 1864. La municipalité fait partie du comté de Dorchester jusqu’en 1982, année où elle se joint à la MRC de La Nouvelle-Beauce. En 2014, elle participe à l’émission La Petite Séduction."],
  portrait: ["Sainte-Marguerite est une municipalité de paroisse de La Nouvelle-Beauce, entre Sainte-Hénédine et Frampton, à 12 km au nord de Sainte-Marie. Les rivières Chassé, Desbarats et Le Bras arrosent son territoire. Le village est bâti sur un mamelon, que rappellent les armoiries municipales.", "Le territoire couvre environ 83 km², dont 99 % en zone agricole. On y pratique surtout la production porcine, laitière et avicole, ainsi que l’acériculture, et une vingtaine d’entreprises s’y sont installées."],
  dates: [["1820", "Arrivée des premiers colons"], ["1831", "Érection canonique de la paroisse"], ["1855", "Création de la municipalité de paroisse"], ["1864", "Fin de la construction de l’église"], ["1982", "Adhésion à la MRC de La Nouvelle-Beauce"]],
  wiki: "https://fr.wikipedia.org/wiki/Sainte-Marguerite_(Québec)"
}, {
  s: "saint-elzear",
  n: "Saint-Elzéar",
  dans: "à Saint-Elzéar",
  de: "de Saint-Elzéar",
  type: "ville",
  arrT: "MRC",
  arr: "La Nouvelle-Beauce",
  zone: "Rive-Sud",
  d: "Village de La Nouvelle-Beauce bâti sur une colline, à 7 km de Sainte-Marie. Le terrain de son église classée offre une vue sur la vallée de la Chaudière et les Appalaches.",
  situe: "Rive-Sud, près de Sainte-Marie",
  chiffre: ["Locataires", "20,5 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église de Saint-Elzéar", "Observatoire du Mont-Cosmos", "Rivière Beaurivage"],
  vie: "Un village animé, avec une centaine de commerces et les Fêtes de chez nous chaque fin de semaine de la fête du Travail.",
  log: "Surtout des maisons unifamiliales au village, avec quelques duplex et petits immeubles. Le tiers de la population vit en milieu agricole.",
  pres: ["Sentiers du Mont-Cosmos", "Bibliothèque municipale", "Sainte-Marie, à 7 km"],
  sav: "Le village est à 7 km de Sainte-Marie et à 56 km de Québec. La route 216 traverse la municipalité.",
  hist: ["Le territoire est détaché de la seigneurie Sainte-Marie, longtemps propriété de la famille Taschereau de Linière. La paroisse de Saint-Elzéar-de-Linière est érigée canoniquement en 1835. Les premiers colons arrivent surtout vers 1845, de l’île d’Orléans, de Beauport, de Château-Richer et de Sainte-Marie, et des familles irlandaises se joignent à eux.", "Le nom honore Henri-Elzéar Juchereau Duchesnay (1809-1871), seigneur de Sainte-Marie à l’époque, avocat et plus tard sénateur. Une municipalité de Saint-Elzéar est créée en 1845 et abolie deux ans plus tard. Le bureau de poste ouvre en 1853, et la municipalité de paroisse voit le jour en 1855.", "Les habitants construisent l’église en pierre de 1852 à 1854. Léandre Parent réalise le décor intérieur de 1855 à 1860, et Ferdinand Villeneuve ajoute un retable en 1893-1894. L’église et la sacristie sont classées monuments historiques en 1960.", "En 1955, le village se détache de la municipalité de paroisse. Les deux entités se regroupent le 30 novembre 1994 sous le nom de Saint-Elzéar. L’observatoire du Mont-Cosmos, lié à l’Université Laval, s’est doté d’un nouveau télescope en 2024."],
  portrait: ["Saint-Elzéar est établie sur les bords de la rivière Beaurivage, et les rivières Nadeau et Savoie arrosent aussi son territoire. Le village coiffe une colline, et le terrain de l’église offre une vue sur la vallée de la Chaudière et les Appalaches. Il se trouve à 7 km de Sainte-Marie, près de Saint-Bernard.", "Le territoire couvre 85,12 km². Les deux tiers de la population habitent le village, et le tiers vit en milieu agricole. L’élevage du porc et l’industrie laitière comptent parmi les bases de l’économie, avec un parc industriel et une centaine de commerces."],
  dates: [["1835", "Érection canonique de la paroisse"], ["1854", "Fin de la construction de l’église"], ["1855", "Création de la municipalité de paroisse"], ["1960", "Classement de l’église et de la sacristie"], ["1994", "Regroupement du village et de la paroisse"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Elzéar_(La_Nouvelle-Beauce)"
}, {
  s: "frampton",
  n: "Frampton",
  dans: "à Frampton",
  de: "de Frampton",
  type: "ville",
  arrT: "MRC",
  arr: "La Nouvelle-Beauce",
  zone: "Rive-Sud",
  d: "Municipalité vallonnée de La Nouvelle-Beauce, à environ 10 km à l’est de Sainte-Marie. Les routes 112, 216 et 275 traversent son territoire, dont le point le plus haut est le mont Frampton.",
  situe: "Rive-Sud, à l’est de Sainte-Marie",
  chiffre: ["Locataires", "11,0 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Mont Frampton", "Zoo Miller", "Église Saint-Édouard"],
  vie: "Un milieu rural et boisé, perché sur les hauteurs, où le plein air occupe une grande place.",
  log: "Surtout des maisons unifamiliales au village, avec quelques duplex. Le reste du territoire compte surtout des fermes et des terres boisées.",
  pres: ["Zoo Miller", "Club de golf Dorchester", "Centre sportif Coffrage LD"],
  sav: "La population vit surtout au village et dans le hameau de Springbrook. Sainte-Marie est à environ 10 km à l’ouest, et les routes 112, 216 et 275 relient Frampton aux municipalités voisines.",
  hist: ["Le canton de Frampton est proclamé le 10 juillet 1806. Le même jour, la Couronne concède 59 lots, soit 11 029 acres, à Pierre-Édouard Desbarats et à ses associés. Traducteur à la Gazette de Québec et à la Chambre d’assemblée du Bas-Canada, Desbarats vend ensuite des lots à des colons irlandais.", "En 1811, le grand voyer décide d’ouvrir une route entre Sainte-Marie et le canton. L’année suivante, Desbarats et George Pyke engagent Robert Gibson pour construire un moulin à scie. Les premiers résidents permanents s’installent entre 1810 et 1815, et le recensement de 1825, le premier sur le territoire, compte 194 habitants.", "En 1825, Mgr Plessis visite Frampton et accepte un terrain offert par Desbarats pour y bâtir une chapelle. Une communauté irlandaise anglicane s’établit aussi dans le nord du canton, où l’église Christ Church of Springbrook et son cimetière forment aujourd’hui un site patrimonial cité. La mission catholique de Saint-Édouard est érigée canoniquement en 1858, et l’église Saint-Édouard est bâtie de 1859 à 1863.", "La municipalité du canton est créée en 1845, abolie en 1847 et rétablie en 1855. En 1892, elle fait place à la municipalité de paroisse de Saint-Édouard-de-Frampton. À la fin du XIXe siècle, les Canadiens français remplacent peu à peu les Irlandais, partis vers les centres industriels. En 1997, la municipalité adopte le nom court de Frampton, déjà courant dans l’usage."],
  portrait: ["Frampton est située en Beauce, entre les rivières Chaudière et Etchemin, à environ 10 km à l’est de Sainte-Marie. Elle touche Sainte-Marguerite et Saint-Malachie au nord, Saint-Léon-de-Standon à l’est et Saints-Anges à l’ouest. Son relief est vallonné, entre 300 et 500 mètres d’altitude, et son sommet, le mont Frampton, porte un parc éolien communautaire depuis 2016.", "Le territoire couvre 151,73 km², occupé surtout par l’agriculture et la forêt. Les lacs Baxter, O’Neil et Desbarats et les rivières Henderson, Pyke et Desbarats l’arrosent. Le Zoo Miller présente une centaine d’animaux le long de sentiers pédestres."],
  dates: [["1806", "Proclamation du canton de Frampton"], ["1825", "Premier recensement, 194 habitants"], ["1858", "Érection canonique de Saint-Édouard"], ["1892", "Municipalité de Saint-Édouard-de-Frampton"], ["1997", "Adoption du nom Frampton"]],
  wiki: "https://fr.wikipedia.org/wiki/Frampton"
}, {
  s: "berthier-sur-mer",
  n: "Berthier-sur-Mer",
  dans: "à Berthier-sur-Mer",
  de: "de Berthier-sur-Mer",
  type: "ville",
  arrT: "MRC",
  arr: "Montmagny",
  zone: "Rive-Sud",
  d: "Village de la MRC de Montmagny au bord du Saint-Laurent, face à la pointe nord-est de l’île d’Orléans. La route 132 le traverse, et sa marina est le point de départ des croisières vers Grosse-Île.",
  situe: "Rive-Sud, à l’est de Québec",
  chiffre: ["Locataires", "14,6 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Parc fluvial et marina", "Plage de Berthier-sur-Mer", "Église Notre-Dame-de-l’Assomption"],
  vie: "Un village au bord du fleuve, calme l’hiver et animé l’été, quand près de 1 000 résidents saisonniers s’ajoutent à la population.",
  log: "Des maisons unifamiliales, dont plusieurs résidences annuelles et secondaires le long du fleuve, et des fermes à l’intérieur des terres.",
  pres: ["Halte routière avec vue sur le fleuve", "Parc Jean-Lesage", "Croisières vers Grosse-Île"],
  sav: "Le village est à environ 35 minutes des ponts de Québec. La route 132 (boulevard Blais) le traverse, et la Route verte passe par le centre du village.",
  hist: ["En 1672, le capitaine Alexandre Berthier, du régiment de Carignan, reçoit une seigneurie détachée de celle de Bellechasse. Comme il nomme aussi Berthier une seconde seigneurie en amont, l’actuelle Berthierville, la première devient Berthier-en-Bas. La seigneurie passe ensuite à la famille des Bergères de Rigauville.", "Une première église de pierre est construite en 1719, et Mgr de Saint-Vallier érige la paroisse Notre-Dame-de-l’Assomption au début des années 1720. Les habitants vivent de l’agriculture et de la navigation, et plusieurs capitaines habitent le village. Ses marins, réputés tenaces, reçoivent le surnom de Casques de fer.", "Un quai est construit en 1853. La municipalité est créée en 1855 sous le nom de Notre-Dame-de-l’Assomption-de-Bellechasse, mais l’usage garde Berthier-en-Bas. L’église actuelle, dessinée par Louis-Thomas Berlinguet, est achevée en 1859, loin du fleuve et de l’érosion. Une maquette de trois-mâts, offerte par des navigateurs du village, est suspendue à sa voûte depuis 1873.", "Des années 1940 à 1960, le quai sert de port d’attache aux goélettes qui transportent du bois de pulpe vers Québec. En 1971, la municipalité adopte le nom de Berthier-sur-Mer pour se distinguer de Berthierville. Le mot mer évoque la largeur du fleuve, son eau salée et ses fortes marées. L’ancien premier ministre Jean Lesage y passait ses étés, et un parc porte son nom."],
  portrait: ["Berthier-sur-Mer s’étend sur la rive sud du Saint-Laurent, sur environ 6 km de long et 2,5 km de profondeur. On y trouve des fermes à l’intérieur des terres et des résidences annuelles et secondaires le long du fleuve. La halte routière offre une vue sur le fleuve, l’archipel de L’Isle-aux-Grues et le mont Sainte-Anne.", "La plage s’étend sur plus d’un kilomètre de sable, et la marina accueille 65 membres saisonniers. Surnommée « Capitale de la Voile » depuis 1992, la municipalité gagne près de 1 000 résidents l’été. Les croisières vers Grosse-Île, ancienne station de quarantaine, et vers l’archipel de L’Isle-aux-Grues partent de sa marina."],
  dates: [["1672", "Concession de la seigneurie de Berthier"], ["1719", "Première église de pierre"], ["1859", "Achèvement de l’église actuelle"], ["1971", "Adoption du nom Berthier-sur-Mer"], ["1992", "Surnommée « Capitale de la Voile »"]],
  wiki: "https://fr.wikipedia.org/wiki/Berthier-sur-Mer"
}, {
  s: "saint-francois-de-la-riviere-du-sud",
  n: "Saint-François-de-la-Rivière-du-Sud",
  dans: "à Saint-François-de-la-Rivière-du-Sud",
  de: "de Saint-François-de-la-Rivière-du-Sud",
  type: "ville",
  arrT: "MRC",
  arr: "Montmagny",
  zone: "Rive-Sud",
  d: "Municipalité agricole et industrielle de la MRC de Montmagny, sur les bords de la rivière du Sud. Le village est à une dizaine de minutes de Montmagny, au sud de l’autoroute 20.",
  situe: "Rive-Sud, au sud-ouest de Montmagny",
  chiffre: ["Locataires", "28,0 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Site patrimonial de Saint-François", "Rivière du Sud", "Centre des loisirs"],
  vie: "Un village actif, entouré de grandes terres agricoles, avec des entreprises manufacturières et de nombreuses installations sportives.",
  log: "Surtout des maisons unifamiliales, avec quelques plex et petits immeubles au village. L’ancien presbytère de 1763 abrite aujourd’hui des résidences.",
  pres: ["Piscine municipale extérieure", "Parc Olivier-Tremblay", "Bibliothèque du Rocher"],
  sav: "Le village est à une dizaine de minutes de Montmagny et à environ 30 minutes de Lévis. La route 228 le traverse et rejoint l’autoroute 20 et Montmagny.",
  hist: ["L’histoire de la paroisse commence en 1727. En 1729, un presbytère-chapelle est construit au bord de la rivière du Sud, alors la principale voie de communication. Il loge le missionnaire, puis le curé.", "Une nouvelle église ouvre au culte en 1762. Au début de 1763, les paroissiens décident de bâtir un presbytère en pierre, terminé à l’automne de la même année. Agrandi en 1811, il est classé immeuble patrimonial en 1979 et porte le nom de Pavillon Pierre-Laurent-Bédard, en souvenir du curé fondateur.", "La paroisse de Saint-François-de-Sales-de-la-Rivière-du-Sud est érigée canoniquement en 1842. La municipalité de paroisse est créée en 1845, abolie en 1847 et rétablie en 1855. L’église actuelle est construite dans les années 1860, puis viennent le couvent en 1883 et le presbytère en 1887.", "En 1985, la municipalité abrège son nom et devient Saint-François-de-la-Rivière-du-Sud. En 1988, l’ensemble formé par l’église, les deux presbytères, le calvaire et l’ancien couvent est classé site patrimonial. Les habitants ont déjà porté le surnom de Casques de cuir, d’après la coiffure qu’ils gardaient hiver comme été."],
  portrait: ["Saint-François-de-la-Rivière-du-Sud est établie sur les bords de la rivière du Sud, à l’est de Saint-Vallier et à environ 20 km au sud-ouest de Montmagny. La rivière du Sud traverse le territoire, où la rejoignent le bras Saint-Michel et la rivière Morigeau. Le village se trouve à quelques minutes du fleuve, au sud de l’autoroute 20.", "La municipalité possède de grandes terres agricoles et des entreprises manufacturières, et elle compte parmi les principaux pôles d’emplois industriels de la MRC de Montmagny. Au centre du village, le site patrimonial classé en 1988 regroupe l’ancien presbytère, l’église, l’ancien couvent de 1883 et le presbytère de 1887."],
  dates: [["1727", "Fondation de la paroisse"], ["1763", "Construction du presbytère en pierre"], ["1842", "Érection canonique de la paroisse"], ["1985", "Adoption du nom actuel"], ["1988", "Classement du site patrimonial"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-François-de-la-Rivière-du-Sud"
}, {
  s: "saint-pierre-de-la-riviere-du-sud",
  n: "Saint-Pierre-de-la-Rivière-du-Sud",
  dans: "à Saint-Pierre-de-la-Rivière-du-Sud",
  de: "de Saint-Pierre-de-la-Rivière-du-Sud",
  type: "ville",
  arrT: "MRC",
  arr: "Montmagny",
  zone: "Rive-Sud",
  d: "Municipalité agricole de la MRC de Montmagny, entre Montmagny et Saint-François-de-la-Rivière-du-Sud. Son église, ouverte en 1785, est la plus ancienne de la région.",
  situe: "Rive-Sud, au sud-ouest de Montmagny",
  chiffre: ["Locataires", "14,9 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église de Saint-Pierre-du-Sud", "Rivière du Sud", "Parc de la Rivière"],
  vie: "Un milieu rural calme, où dominent l’agriculture et les érablières, et où l’on vient observer le ciel étoilé.",
  log: "Surtout des maisons unifamiliales et des fermes, avec quelques logements au village.",
  pres: ["Parc d’observation astronomique", "Bibliothèque La Volumineuse", "Centre récréatif Groupe Picard"],
  sav: "La route 228 traverse la municipalité et rejoint Montmagny et l’autoroute 20. Le parc d’observation astronomique est en forêt, à une dizaine de kilomètres du village.",
  hist: ["Le territoire fait partie de la seigneurie de la Rivière-du-Sud, concédée à Charles Huault de Montmagny en 1646. Un certain Lecolombier s’y installe brièvement en 1696, mais la colonisation commence surtout au début du XVIIIe siècle. En 1709, Pierre Blanchet donne un terrain, et une chapelle est construite en 1713 au nord de la rivière du Sud.", "La paroisse, dont les limites sont fixées en 1722, est placée sous la protection de saint Pierre en l’honneur de Pierre Blanchet. Desservie d’abord par les prêtres de Saint-Thomas, elle accueille un curé en 1751. Le 25 mars 1776, pendant le siège de Québec par l’Armée continentale, la bataille de Saint-Pierre a lieu près du village entre deux groupes formés surtout de miliciens canadiens.", "L’église actuelle, la troisième de la paroisse, est construite en 1784 et 1785 selon le modèle proposé par l’évêque Jean-Olivier Briand. Thomas Baillairgé redessine son clocher en 1839. Elle est classée en 1972.", "La municipalité est créée en 1845, abolie en 1847 puis rétablie en 1855, et la paroisse est érigée canoniquement en 1848. Le bureau de poste, ouvert en 1852, porte le nom de Saint-Pierre-Montmagny. Le cimetière, aménagé à partir de 1908 en terrasses sur un affleurement rocheux, est aujourd’hui un site patrimonial cité. En 2013, la paroisse a célébré ses 300 ans."],
  portrait: ["Saint-Pierre-de-la-Rivière-du-Sud est une municipalité de paroisse de la Côte-du-Sud, entre Montmagny et Saint-François-de-la-Rivière-du-Sud. La rivière du Sud longe sa limite nord et rend fertiles les terres de ce secteur. Les rivières Morigeau et des Poitras et le ruisseau de la Blague complètent le réseau hydrographique.", "L’agriculture et l’acériculture occupent une grande place, et la municipalité se présente comme le berceau des puisatiers du Québec. Un club d’astronomie s’y est installé en 2006, et un site d’observation équipé d’observatoires, le Portail étoilé, a été inauguré en forêt en 2011."],
  dates: [["1713", "Construction de la première chapelle"], ["1776", "Bataille de Saint-Pierre"], ["1785", "Ouverture de l’église actuelle"], ["1855", "Création de la municipalité de paroisse"], ["2013", "300e anniversaire de la paroisse"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Pierre-de-la-Rivière-du-Sud"
}, {
  s: "saint-agapit",
  n: "Saint-Agapit",
  dans: "à Saint-Agapit",
  de: "de Saint-Agapit",
  type: "ville",
  arrT: "MRC",
  arr: "Lotbinière",
  zone: "Rive-Sud",
  d: "Municipalité de la MRC de Lotbinière, au sud de Saint-Apollinaire, sur les bords de la rivière Noire. Les routes 116 et 273 la traversent.",
  situe: "Rive-Sud, au sud de Saint-Apollinaire",
  chiffre: ["Locataires", "24,5 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église de Saint-Agapit", "Rivière Noire", "Route verte"],
  vie: "Un gros village agricole qui sert aussi de centre de services pour le secteur. Chaque année, l’Expo agricole, le rodéo et le Festival Country Lotbinière s’y tiennent sur le site de la Société d’agriculture.",
  log: "Surtout des maisons unifamiliales, mais aussi beaucoup de jumelés, quelques maisons en rangée et de petits immeubles à logements. Au recensement de 2021, environ un ménage sur quatre était locataire.",
  pres: ["Complexe des Seigneuries", "Centre d’études collégiales de Lotbinière", "École Beaurivage"],
  sav: "Les autobus d’Express Lotbinière s’arrêtent au Campus de Lotbinière et rejoignent Saint-Apollinaire, où une ligne mène au réseau de la STLévis. Vers le nord, la route 273 mène à Saint-Apollinaire et à l’autoroute 20.",
  hist: ["Le 1er avril 1738, la seigneurie Saint-Gilles, aussi appelée seigneurie de Beaurivage, est concédée à Gilles Rageot de Beaurivage, un négociant de Québec. Le secteur de la rivière Noire est ouvert à la colonisation vers 1830 par des gens venus de Saint-Nicolas, de Montmagny et de Sainte-Croix.", "Les colons doivent alors se rendre à l’église de Saint-Gilles, à plusieurs milles de chez eux, été comme hiver. Vers 1860, ils demandent l’appui de l’abbé Guillaume Dunn, curé de Saint-Gilles, pour bâtir une chapelle. Le 18 février 1867, l’archevêque de Québec érige la paroisse de Saint-Agapit-de-Beaurivage, et la municipalité est fondée le 8 mai suivant.", "Le premier curé résident arrive en 1868, et le bureau de poste prend le nom de Saint-Agapit en 1880. En 1885, la chapelle étant devenue trop petite, la paroisse obtient la permission de bâtir une église, dessinée par l’architecte David Ouellet. Le village grandit au point de rencontre du chemin de fer et de la route.", "En 1911, le village se détache de la paroisse sous le nom de Saint-Agapitville. Les deux municipalités se regroupent le 14 avril 1979 sous le nom de Saint-Agapit. En 2011, la municipalité inaugure le Complexe des Seigneuries, avec une salle d’entraînement et des salles pour les spectacles, les conférences et les réceptions."],
  portrait: ["Saint-Agapit est la deuxième municipalité la plus peuplée de la MRC de Lotbinière. Son territoire d’environ 64 km² se trouve au sud de Saint-Apollinaire et du secteur Bernières, à Lévis. La rivière Noire le traverse d’ouest en est, et la Route verte longe la route 116 sur l’emplacement de l’ancienne voie ferrée.", "Selon le décret de population de 2026 du gouvernement du Québec, elle compte 4 803 habitants. L’agriculture tient une grande place dans l’économie, à côté d’entreprises de fabrication dans le métal, le bois et les portes et fenêtres. On y trouve deux écoles primaires, l’École Beaurivage, le Centre d’études collégiales de Lotbinière, une clinique médicale et une pharmacie."],
  dates: [["1738", "Concession de la seigneurie de Beaurivage"], ["1867", "Érection de la paroisse"], ["1911", "Création de Saint-Agapitville"], ["1979", "Fusion qui forme Saint-Agapit"], ["2011", "Ouverture du Complexe des Seigneuries"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Agapit"
}, {
  s: "saint-antoine-de-tilly",
  n: "Saint-Antoine-de-Tilly",
  dans: "à Saint-Antoine-de-Tilly",
  de: "de Saint-Antoine-de-Tilly",
  type: "ville",
  arrT: "MRC",
  arr: "Lotbinière",
  zone: "Rive-Sud",
  d: "Village au bord du fleuve Saint-Laurent, à environ 25 km de Québec par la route 132. Le chemin de Tilly traverse le village, bordé de maisons anciennes.",
  situe: "Rive-Sud, au bord du fleuve à l’ouest de Lévis",
  chiffre: ["Locataires", "13,6 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église de Saint-Antoine-de-Tilly", "Manoir de Tilly", "Chemin de Tilly"],
  vie: "Un village patrimonial calme, membre de l’Association des plus beaux villages du Québec. On y profite du fleuve, des plages et des vergers.",
  log: "Surtout des maisons unifamiliales, dont plusieurs maisons anciennes dans le village. Au recensement de 2021, près de neuf ménages sur dix étaient propriétaires, alors les logements à louer y sont peu nombreux.",
  pres: ["Belvédère sur le fleuve", "Plage et quai", "Fromagerie Bergeron"],
  sav: "Les autobus d’Express Lotbinière s’arrêtent au centre communautaire et rejoignent Saint-Apollinaire, où une ligne mène au réseau de la STLévis. L’école primaire de la Clé-d’Or est au village, et l’école secondaire la plus proche est à Sainte-Croix.",
  hist: ["Le 29 octobre 1672, l’intendant Jean Talon concède le territoire à Claude-Sébastien de Villieu, lieutenant du régiment de Carignan. Le recensement de 1681 y nomme cinq premiers colons. En 1700, la famille de Villieu vend la seigneurie à Pierre-Noël Le Gardeur, sieur de Tilly, et elle prend dès lors le nom de Tilly.", "Dès 1702, le seigneur fait bâtir une chapelle en bois placée sous le vocable de saint Antoine de Padoue, et les registres de la paroisse s’ouvrent. La première pierre d’une église est posée en 1712. Pendant le siège de Québec, en 1759, des soldats anglais débarquent à Saint-Antoine et se retranchent dans l’église.", "En 1786, le seigneur fait construire le manoir de Tilly, devenu un hôtel. L’église actuelle est bénie le 24 septembre 1788, et son décor intérieur comprend des boiseries conçues notamment par Thomas Baillairgé. Elle est classée monument historique en 1963.", "La municipalité de paroisse est créée en 1845, abolie en 1847, puis fondée de nouveau en 1855. Au fil du temps, une partie de son territoire sert à former Saint-Apollinaire et Issoudun. En 1995, elle devient la municipalité de Saint-Antoine-de-Tilly, et elle fête le 300e anniversaire de sa fondation en 2002."],
  portrait: ["Saint-Antoine-de-Tilly s’étend sur environ 60 km² le long de la rive sud du Saint-Laurent. C’est la première municipalité de Lotbinière quand on arrive de Lévis, et les routes 132 et 273 la traversent. Le village compte plus de 50 maisons et bâtiments d’architecture patrimoniale, dont trois manoirs seigneuriaux, un ancien magasin général et deux chapelles de procession.", "Selon le décret de population de 2026 du gouvernement du Québec, la municipalité compte 1 755 habitants. L’agriculture y tient une grande place, avec des fermes laitières, des vergers et des comptoirs maraîchers. Du haut de la falaise, un belvédère près du cimetière donne vue sur Neuville, sur l’autre rive."],
  dates: [["1672", "Concession du territoire par Jean Talon"], ["1700", "La seigneurie prend le nom de Tilly"], ["1702", "Ouverture des registres de la paroisse"], ["1788", "Bénédiction de l’église actuelle"], ["2002", "300e anniversaire de la fondation"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Antoine-de-Tilly"
}, {
  s: "saint-gilles",
  n: "Saint-Gilles",
  dans: "à Saint-Gilles",
  de: "de Saint-Gilles",
  type: "ville",
  arrT: "MRC",
  arr: "Lotbinière",
  zone: "Rive-Sud",
  d: "Municipalité agricole et forestière au pied des Appalaches, dans l’est de la MRC de Lotbinière. La rivière Beaurivage la traverse du sud au nord.",
  situe: "Rive-Sud, à 20 minutes de Lévis",
  chiffre: ["Locataires", "17,5 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Rivière Beaurivage", "Église de Saint-Gilles", "Centre récréatif de Saint-Gilles"],
  vie: "Une grande municipalité rurale où les fermes familiales et les boisés occupent la plus grande partie du territoire, autour d’un village tranquille.",
  log: "Surtout des maisons unifamiliales, avec quelques jumelés et de petits immeubles à logements au village. Au recensement de 2021, un peu moins d’un ménage sur cinq était locataire.",
  pres: ["École Étienne-Chartier", "Bibliothèque municipale", "Terrains de soccer"],
  sav: "La voiture est le principal moyen de transport. Les autobus d’Express Lotbinière s’arrêtent à la salle municipale et rejoignent Saint-Agapit et Saint-Apollinaire, où une ligne mène au réseau de la STLévis.",
  hist: ["Le 1er avril 1738, la seigneurie Saint-Gilles est concédée à Gilles Rageot de Beaurivage, un important négociant de Québec. Elle est vendue en 1782 à Alexander Fraser. Vers 1791, Arthur Davidson, qui administre la seigneurie au nom de son jeune fils Walter, fait bâtir un moulin à scie et à farine au bord de la rivière Beaurivage, sur le territoire de Saint-Gilles.", "L’ouverture du chemin Craig, en 1810, facilite l’arrivée des colons. Entre 1811 et 1820, le seigneur Walter Davidson concède 72 lots dans le secteur de Saint-Gilles. En 1819, il y achète une terre pour s’y faire construire un manoir. La paroisse est érigée canoniquement le 17 février 1828, puis civilement le 11 juillet 1835.", "La municipalité de paroisse est constituée le 1er juillet 1855, et son territoire sert ensuite à former plusieurs paroisses voisines. Quand Saint-Narcisse est fondée, en 1872, les deux paroisses doivent partager le même curé, qui réside à Saint-Narcisse. En 1876, l’archevêché décrète même la suppression de Saint-Gilles, mais les paroissiens obtiennent l’annulation de la décision dès le mois de juin.", "L’église actuelle est construite en 1882 et 1883 sur les plans de l’architecte David Ouellet, avec un presbytère, un cimetière et un calvaire tout près. Le 24 septembre 2016, la municipalité de la paroisse de Saint-Gilles devient la municipalité de Saint-Gilles."],
  portrait: ["Avec environ 181 km², Saint-Gilles est la plus grande municipalité de la MRC de Lotbinière, soit environ 11 % de son territoire. Elle se trouve au pied des Appalaches, et plusieurs cours d’eau la sillonnent, dont la rivière Beaurivage, la rivière aux Pins et le Bras d’Henri. Il faut parcourir environ 20 km pour rejoindre l’autoroute 20 à Saint-Apollinaire ou à Saint-Étienne-de-Lauzon.", "Selon le décret de population de 2026 du gouvernement du Québec, elle compte 3 508 habitants. L’économie repose surtout sur l’agriculture et les activités qui y sont liées. Lévis est à environ 20 minutes de route, et Québec, à 30 minutes."],
  dates: [["1738", "Concession de la seigneurie Saint-Gilles"], ["1810", "Ouverture du chemin Craig"], ["1828", "Érection canonique de la paroisse"], ["1855", "Constitution de la municipalité"], ["1883", "Fin de la construction de l’église"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Gilles_(Québec)"
}, {
  s: "saint-narcisse-de-beaurivage",
  n: "Saint-Narcisse-de-Beaurivage",
  dans: "à Saint-Narcisse-de-Beaurivage",
  de: "de Saint-Narcisse-de-Beaurivage",
  type: "ville",
  arrT: "MRC",
  arr: "Lotbinière",
  zone: "Rive-Sud",
  d: "Petite municipalité rurale dans l’est de la MRC de Lotbinière, à environ 20 minutes des ponts de Québec. La rue Principale traverse le village.",
  situe: "Rive-Sud, à 20 minutes des ponts de Québec",
  chiffre: ["Locataires", "22,2 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église de Saint-Narcisse-de-Beaurivage", "Rue Principale", "Bras d’Henri"],
  vie: "Une petite communauté rurale où l’entraide compte. Chaque année en juin, le Festival de la Gargouille rassemble les familles, comme il le fait depuis 1983.",
  log: "Surtout des maisons unifamiliales, avec quelques jumelés et de petits immeubles à logements au village. Au recensement de 2021, un peu plus d’un ménage sur cinq était locataire.",
  pres: ["Piscine extérieure", "Patinoire couverte", "Bibliothèque municipale"],
  sav: "Aucune route provinciale numérotée ne traverse la municipalité, et on s’y déplace surtout en voiture. Express Taxi, le transport collectif sur réservation de la MRC, permet de rejoindre en semaine des pôles comme Laurier-Station et Saint-Agapit.",
  hist: ["La majeure partie du territoire faisait partie de la seigneurie de Beaurivage, et une autre portion, de la seigneurie de Lauzon. Le peuplement commence dans les années 1820. Le chemin Craig, ouvert en 1810, amène des familles irlandaises, canadiennes-françaises, allemandes et anglo-saxonnes.", "Une bonne partie du territoire relève alors de la paroisse de Saint-Gilles. Les habitants des rangs Iberville, Saint-Noël, Saint-Thomas et Fiddler Green passent leur dimanche à s’y rendre pour la messe, quand les crues de la rivière Beaurivage ne bloquent pas le passage. Ils demandent donc à l’archevêché un curé résident.", "La paroisse est érigée canoniquement en 1872, à partir de terres de Saint-Gilles, de Saint-Patrice-de-Beaurivage, de Saint-Lambert-de-Lauzon et de Saint-Bernard. La municipalité de paroisse est constituée en 1874, l’année où le bureau de poste ouvre sous le nom de Newbois. Une première église, bâtie en 1872, brûle sept ans plus tard, et l’église actuelle, dessinée par Siroy Lafleur, est construite en 1879 et 1880.", "Le Festival de la Gargouille est fondé en 1983. Au début des années 2000, la municipalité modernise ses réseaux d’aqueduc et d’égout, ce qui accompagne l’expansion de secteurs résidentiels et industriels. Le complexe récréatif, avec sa patinoire couverte, est inauguré en 2010, et la paroisse fête ses 150 ans en 2022."],
  portrait: ["Saint-Narcisse-de-Beaurivage couvre environ 61 km² dans l’est de la MRC de Lotbinière, à 22 km de Saint-Agapit et à 8 km de Saint-Bernard. Le Bras d’Henri et le Petit bras d’Henri sillonnent son territoire, qui fait partie du bassin de la rivière Chaudière. Le réseau local compte la rue Principale et plusieurs rangs, dont le rang Iberville et le rang Saint-Thomas.", "Selon le décret de population de 2026 du gouvernement du Québec, la municipalité compte 1 305 habitants, contre 1 152 au recensement de 2021. On y trouve l’école primaire l’Arc-en-Ciel, une bibliothèque, un centre communautaire, une piscine extérieure et une patinoire couverte. Le centre sportif porte le nom du hockeyeur Yanni Gourde, qui a grandi à Saint-Narcisse."],
  dates: [["1872", "Érection canonique de la paroisse"], ["1874", "Constitution de la municipalité"], ["1880", "Fin de la construction de l’église"], ["1983", "Fondation du Festival de la Gargouille"], ["2010", "Inauguration du complexe récréatif"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Narcisse-de-Beaurivage"
}, {
  s: "notre-dame-du-sacre-coeur-d-issoudun",
  n: "Notre-Dame-du-Sacré-Coeur-d’Issoudun",
  dans: "à Notre-Dame-du-Sacré-Coeur-d’Issoudun",
  de: "de Notre-Dame-du-Sacré-Coeur-d’Issoudun",
  type: "ville",
  arrT: "MRC",
  arr: "Lotbinière",
  zone: "Rive-Sud",
  d: "Petite municipalité agricole, connue simplement sous le nom d’Issoudun, à 7 km de Laurier-Station par la route 271. La rue Principale traverse le village.",
  situe: "Rive-Sud, à 40 km des ponts de Québec",
  chiffre: ["Locataires", "8,5 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église d’Issoudun", "Moulin à scie à vapeur", "Sentier La Tourbière"],
  vie: "Un village paisible entouré de terres agricoles, où le comité des loisirs organise des activités familiales tout au long de l’année.",
  log: "Presque uniquement des maisons unifamiliales et des fermes. Au recensement de 2021, moins d’un ménage sur dix était locataire, donc les logements à louer y sont rares.",
  pres: ["Musée Isidore-Boisvert", "Parc Compagnons-des-Prés", "Bibliothèque La Rêverie"],
  sav: "Les autobus d’Express Lotbinière s’arrêtent rue des Mélèzes et relient Issoudun à Laurier-Station, à Sainte-Croix et à Saint-Apollinaire, où une ligne mène au réseau de la STLévis. L’école primaire la plus proche est à Laurier-Station.",
  hist: ["Avant 1903, le secteur est partagé entre cinq paroisses : Saint-Édouard, Sainte-Croix, Saint-Antoine-de-Tilly, Saint-Apollinaire et Saint-Flavien. En 1885, Honoré Ferland y exploite déjà un moulin à scie actionné par l’eau, au bord de la rivière, dans le 6e rang.", "En 1903, des citoyens de ces paroisses demandent à l’évêché une nouvelle église. La paroisse prend le nom de Notre-Dame-du-Sacré-Coeur-d’Issoudun, en l’honneur des Missionnaires du Sacré-Coeur venus d’Issoudun, en France. La première messe est célébrée le 15 juillet 1903 dans une maison du village, et le 24 octobre 1904, une messe est célébrée dans l’église pour les 88 familles de la paroisse.", "La paroisse est reconnue canoniquement en 1909, l’année où la municipalité est constituée, et le premier conseil se réunit chez le maire Xavier Fortier. Le 4 août 1910, la foudre détruit l’église à peine terminée, et les paroissiens retrouvent une église reconstruite le 10 septembre 1911. En 1910 aussi, Herménégilde Ferland déménage le moulin familial au centre du village et le convertit à la vapeur.", "Au début des années 1960, une école centralisée est construite près de l’église et accueille les élèves dès 1963. Issoudun est jumelée à la ville française d’Issoudun depuis 1977. Le comité Nature-Environnement aménage le sentier La Tourbière en 2010, et le moulin à vapeur, plus que centenaire, fonctionne encore à l’occasion."],
  portrait: ["Officiellement nommée Notre-Dame-du-Sacré-Coeur-d’Issoudun, la municipalité est connue de tous sous le nom d’Issoudun. Son territoire d’environ 61 km² est traversé par la route 271 et, au sud-ouest, par la rivière Huron. Les ponts de Québec sont à environ 40 km, soit une vingtaine de minutes par l’autoroute 20.", "Selon le décret de population de 2026 du gouvernement du Québec, elle compte 902 habitants. Le centre communautaire de la rue Principale abrite la bibliothèque et le musée Isidore-Boisvert, et une halte patrimoniale devant l’édifice raconte l’histoire du village. Derrière, on trouve un parc avec modules de jeux, un pumptrack et des terrains de soccer et de baseball."],
  dates: [["1885", "Moulin à scie d’Honoré Ferland"], ["1903", "Fondation de la paroisse"], ["1909", "Constitution de la municipalité"], ["1911", "Ouverture de l’église reconstruite"], ["1977", "Jumelage avec Issoudun, en France"]],
  wiki: "https://fr.wikipedia.org/wiki/Notre-Dame-du-Sacré-Cœur-d'Issoudun"
}, {
  s: "saint-patrice-de-beaurivage",
  n: "Saint-Patrice-de-Beaurivage",
  dans: "à Saint-Patrice-de-Beaurivage",
  de: "de Saint-Patrice-de-Beaurivage",
  type: "ville",
  arrT: "MRC",
  arr: "Lotbinière",
  zone: "Rive-Sud",
  d: "Municipalité agricole dans l’est de la MRC de Lotbinière, entre Saint-Narcisse-de-Beaurivage et Saint-Sylvestre. La route 269, qui suit l’ancien chemin Craig, traverse le village.",
  situe: "Rive-Sud, au pied des Appalaches",
  chiffre: ["Locataires", "24,4 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église de Saint-Patrice-de-Beaurivage", "Rivière Beaurivage", "Route 269 (chemin Craig)"],
  vie: "Un village entouré de collines et de fermes, qui garde la trace de ses pionniers irlandais, à commencer par son nom.",
  log: "Surtout des maisons unifamiliales, avec quelques logements dans des duplex et de petits immeubles au village. Au recensement de 2021, environ un ménage sur quatre était locataire.",
  pres: ["Manoir Ross", "Croix lumineuse", "École la Source"],
  sav: "On se déplace surtout en voiture. Le CLSC et l’école secondaire les plus proches sont à Sainte-Marie, en Beauce, et Express Taxi, le transport collectif sur réservation de la MRC, offre des trajets en semaine.",
  hist: ["Le territoire fait partie de la seigneurie Saint-Gilles, ou de Beaurivage, concédée en 1738 à Gilles Rageot de Beaurivage. Alexander Fraser l’achète en 1782 et fait préparer, dès 1783, des titres de concession pour quinze colons d’origine allemande. Ce sont les premiers Beaurivageois.", "Vers 1840, environ 200 familles catholiques venues d’Irlande s’établissent à Saint-Patrice et à Saint-Sylvestre. Le seigneur Arthur Ross fait construire un manoir d’inspiration française, toujours debout. Au printemps 1860, faute d’accord de l’évêché, les colons bâtissent eux-mêmes une chapelle sur une terre donnée par le seigneur.", "La paroisse est érigée canoniquement le 2 octobre 1871, et Arthur Davidson Ross devient le premier maire. La première séance du conseil a lieu le 11 février 1873, et les procès-verbaux sont alors rédigés en anglais. Le 14 septembre 1921, Saint-Patrice se divise en deux municipalités, le village et la paroisse.", "L’église actuelle est construite de 1901 à 1903 selon les plans de l’architecte Joseph-Pierre Ouellet. En 1923, Joseph-Arcade et Rose-Anna Vachon quittent leur village natal pour Sainte-Marie, où naît la boulangerie Vachon. Une croix de fer est érigée en 1946 sur les hauteurs du rang Saint-Charles, puis illuminée, et le village et la paroisse fusionnent en 1984."],
  portrait: ["Saint-Patrice-de-Beaurivage occupe environ 86 km² dans la partie est de la MRC de Lotbinière, entre Saint-Narcisse-de-Beaurivage au nord et Saint-Sylvestre au sud. Son territoire, parsemé de collines, est traversé par la rivière Beaurivage et par la rivière Filkars, qui s’y jette. La route 269 passe au village.", "Selon le décret de population de 2026 du gouvernement du Québec, elle compte 1 087 habitants. L’agriculture domine l’économie, surtout l’élevage de porcs, de bovins de boucherie et de volailles. Les écoles relèvent du Centre de services scolaire de la Beauce-Etchemin, et l’école primaire la Source se trouve au village."],
  dates: [["1783", "Arrivée de colons d’origine allemande"], ["1871", "Érection canonique de la paroisse"], ["1903", "Fin de la construction de l’église"], ["1921", "Séparation du village et de la paroisse"], ["1984", "Fusion du village et de la paroisse"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Patrice-de-Beaurivage"
}, {
  s: "laurier-station",
  n: "Laurier-Station",
  dans: "à Laurier-Station",
  de: "de Laurier-Station",
  type: "ville",
  arrT: "MRC",
  arr: "Lotbinière",
  zone: "Rive-Sud",
  d: "Municipalité de village au centre de la MRC de Lotbinière, à 43 km au sud-ouest de Québec. L’autoroute Jean-Lesage (20) la traverse, et le boulevard Saint-Joseph (route 271) en est l’artère principale.",
  situe: "Rive-Sud, à 43 km de Québec",
  chiffre: ["Locataires", "31,1 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Boulevard Saint-Joseph", "Gare de Laurier-Station", "Autoroute Jean-Lesage (20)"],
  vie: "Un carrefour régional où se concentrent commerces, industries et services, entouré de terres agricoles. Le développement résidentiel s’y est accéléré ces dernières années, avec plusieurs nouveaux quartiers.",
  log: "Des maisons unifamiliales, des jumelés et de nombreux appartements dans de petits immeubles, dont plusieurs dans des quartiers récents. Au recensement de 2021, près d’un ménage sur trois était locataire.",
  pres: ["Complexe Récréatif", "CLSC de Laurier-Station", "École de la Source"],
  sav: "Les autobus d’Express Lotbinière s’arrêtent rue Jacques et près de la chapelle, puis rejoignent Saint-Apollinaire, où une ligne mène au réseau de la STLévis. Le CLSC de Laurier-Station dessert une grande partie de la MRC.",
  hist: ["Le secteur fait d’abord partie de la paroisse de Saint-Flavien. En 1895, selon l’histoire locale, le cultivateur Thomas Caron convainc le surintendant du Drummond County Railway de faire passer la voie ferrée plus au nord, sur les terres d’un secteur qu’on appellera La Station. Ce détour est resté connu sous le nom de « Croche à Caron ».", "La voie ferrée est inaugurée le 1er mars 1898, et une gare y est construite. On la nomme Laurier, en l’honneur de sir Wilfrid Laurier, premier ministre du Canada de 1896 à 1911, qui s’y serait arrêté pendant une campagne électorale. En 1906, Mme Théophile Daigle, née Octavie Lemay, et sa famille bâtissent un moulin à scie près du chemin de fer.", "La première gare est détruite lors d’un déraillement en juillet 1918, puis reconstruite. L’industrie du meuble s’implante peu à peu, et la première usine de meubles, Meubles Laurier, est construite en 1945. Des commerces et des services suivent.", "Le secteur se détache de Saint-Flavien et devient la municipalité de Laurier-Station le 1er janvier 1951, et la nouvelle chapelle accueille sa première messe le 28 janvier suivant. Au début des années 1960, l’autoroute Transcanadienne, aujourd’hui l’autoroute Jean-Lesage, attire de nouveaux commerces, industries et services gouvernementaux. Le petit village devient un carrefour régional."],
  portrait: ["Avec environ 12 km², Laurier-Station est la plus petite municipalité de la MRC de Lotbinière par sa superficie et la plus densément peuplée. Elle s’est développée de part et d’autre de l’autoroute 20, au croisement du chemin de fer et de la route 271. Le village réunit une zone commerciale et industrielle le long de l’autoroute et des secteurs résidentiels, entourés de terres agricoles.", "Selon le décret de population de 2026 du gouvernement du Québec, elle compte 2 841 habitants. On y trouve le CLSC, deux pharmacies, une clinique dentaire et le Complexe Récréatif, avec ses activités aquatiques. Les trains passent encore par la gare, reconstruite après 1918."],
  dates: [["1898", "Inauguration de la voie ferrée"], ["1906", "Construction du moulin à scie Daigle"], ["1918", "Première gare détruite par un déraillement"], ["1945", "Première usine de meubles"], ["1951", "Constitution de la municipalité"]],
  wiki: "https://fr.wikipedia.org/wiki/Laurier-Station"
}, {
  s: "saint-flavien",
  n: "Saint-Flavien",
  dans: "à Saint-Flavien",
  de: "de Saint-Flavien",
  type: "ville",
  arrT: "MRC",
  arr: "Lotbinière",
  zone: "Rive-Sud",
  d: "Municipalité agricole au centre de la MRC de Lotbinière, juste au sud de Laurier-Station. Le village se trouve au croisement de la route 271 et du rang des Pointes.",
  situe: "Rive-Sud, au sud de Laurier-Station",
  chiffre: ["Locataires", "24,1 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église de Saint-Flavien", "Rang des Pointes", "Route 271"],
  vie: "Un village calme, entouré de grandes terres agricoles au relief plat. Les services de Laurier-Station sont tout près.",
  log: "Surtout des maisons unifamiliales, avec quelques jumelés et de petits immeubles à logements au village. Au recensement de 2021, environ un ménage sur quatre était locataire.",
  pres: ["École de la Caravelle", "Monument du Sacré-Coeur", "CLSC de Laurier-Station"],
  sav: "On se déplace surtout en voiture. Saint-Flavien est l’un des pôles desservis par Express Taxi, le transport collectif sur réservation de la MRC, offert en semaine de 7 h à 17 h.",
  hist: ["La colonisation commence dans les années 1750, à la toute fin du Régime français. Le territoire est alors partagé entre la seigneurie de Sainte-Croix, dont il forme la 7e concession, et la seigneurie des Plaines. Au début du XIXe siècle, des familles de Sainte-Croix et de Saint-Antoine-de-Tilly s’y installent et commencent à cultiver la terre.", "La paroisse est érigée canoniquement le 1er décembre 1834 et nommée en l’honneur de Mgr Pierre-Flavien Turgeon, futur archevêque de Québec. Elle est érigée civilement le 28 septembre 1843. Il faut pourtant attendre une quinzaine d’années avant la première chapelle, et plus de 20 ans avant l’arrivée d’un curé résident.", "L’église actuelle est construite en 1880 sur les plans de l’architecte David Ouellet. Le village se développe ensuite avec l’arrivée d’un médecin résident en 1889, d’une manufacture de couture en 1900, de la Banque provinciale en 1908 et d’une fabrique de beurre en 1910. En 1912, Saint-Flavien se divise en deux municipalités, le village et la paroisse.", "Saint-Flavien est électrifié en 1928. En 1951, le secteur de La Station se détache de la paroisse pour devenir Laurier-Station. De 1980 à 1994, la Société québécoise d’initiatives pétrolières exploite le gaz naturel du sous-sol, et le gisement épuisé sert depuis 1997 à l’entreposage saisonnier du gaz. Le 29 décembre 1999, le village et la paroisse forment de nouveau une seule municipalité."],
  portrait: ["Saint-Flavien couvre environ 66 km² au centre de la MRC de Lotbinière, soit environ 4 % de son territoire. Le rang Saint-Joseph (route 271) la traverse du nord au sud, et le rang des Pointes, d’est en ouest. Le noyau villageois se trouve à leur croisement, et l’autoroute Jean-Lesage passe sur un court segment au nord-ouest.", "Selon le décret de population de 2026 du gouvernement du Québec, la municipalité compte 1 682 habitants. L’école de la Caravelle de Saint-Flavien accueille le préscolaire et le premier cycle du primaire, les cycles suivants se donnant à Joly et à Dosquet. Les écoles secondaires les plus proches sont à Saint-Agapit et à Sainte-Croix."],
  dates: [["1834", "Érection canonique de la paroisse"], ["1880", "Construction de l’église"], ["1912", "Séparation du village et de la paroisse"], ["1928", "Arrivée de l’électricité"], ["1999", "Regroupement en une seule municipalité"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Flavien_(Québec)"
}, {
  s: "dosquet",
  n: "Dosquet",
  dans: "à Dosquet",
  de: "de Dosquet",
  type: "ville",
  arrT: "MRC",
  arr: "Lotbinière",
  zone: "Rive-Sud",
  d: "Petite municipalité rurale de la MRC de Lotbinière, à 11 km au sud de l’autoroute 20 par la sortie 278. Les routes 116 et 271 la traversent.",
  situe: "Rive-Sud, au sud de l’autoroute 20",
  chiffre: ["Locataires", "18,8 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Église de Dosquet", "Presbytère de Dosquet", "Route verte"],
  vie: "Un petit village rural et tranquille, traversé par la piste cyclable aménagée sur l’ancienne voie ferrée.",
  log: "Surtout des maisons unifamiliales, avec quelques logements dans de petits immeubles au village. Au recensement de 2021, moins d’un ménage sur cinq était locataire.",
  pres: ["Salle multifonctionnelle", "Bibliothèque municipale", "École de la Caravelle"],
  sav: "On se déplace surtout en voiture. La sortie 278 de l’autoroute 20 est à 11 km, et Express Taxi, le transport collectif sur réservation de la MRC, mène en semaine vers des pôles comme Laurier-Station et Saint-Agapit.",
  hist: ["Dans les années 1830 et 1840, le noyau du village s’appelle Méthot’s Mill, d’après le moulin à scie que Louis Méthot, venu de Sainte-Croix, a construit au bord de la rivière Henri. Une centaine d’hommes y travaillent à déboiser et à transporter le bois. Les meilleures terres défrichées deviennent ensuite des fermes.", "La première gare est construite en 1874 et porte elle aussi le nom de Méthot’s Mill. Le 16 mai 1880, la veuve de Louis Méthot cède ses terres de Méthot’s Mill à son fils Wenceslas. François-Xavier Caron, gendre du pionnier Octave Ratté, est chef de gare de 1885 à 1937, et une seconde gare est construite en 1910.", "Le 24 décembre 1912, le lieutenant-gouverneur proclame la municipalité de Saint-Octave-de-Dosquet, nommée en l’honneur de Mgr Pierre-Herman Dosquet, évêque de Québec. À cause d’un vice de forme dans l’élection du conseil, la Gazette officielle ne l’annonce que le 9 février 1918. Le presbytère est commencé en 1915, et l’église est bénie le 16 juillet 1922 par le cardinal Louis-Nazaire Bégin.", "La gare est fermée par le CN en 1970. L’église, détruite par un incendie en 1988, est remplacée en 1990, l’année où l’on enlève les rails de la voie désaffectée. La municipalité prend le nom de Dosquet en 1996, la MRC aménage une piste cyclable sur l’ancienne voie ferrée en 1998, et Dosquet fête son 100e anniversaire en 2012."],
  portrait: ["Dosquet occupe environ 65 km² dans la MRC de Lotbinière. Les routes 116 et 271 la traversent, et la Route verte longe la route 116 sur l’ancienne voie ferrée. La rivière du Chêne, la rivière Henri et la rivière aux Cèdres coulent sur son territoire.", "Selon le décret de population de 2026 du gouvernement du Québec, la municipalité compte 927 habitants. On y trouve une salle multifonctionnelle, une bibliothèque, un bureau de poste, une maison des jeunes et un terrain de hockey extérieur. L’école de la Caravelle de Dosquet accueille les élèves du 3e cycle du primaire."],
  dates: [["1874", "Première gare, nommée Méthot’s Mill"], ["1912", "Proclamation de Saint-Octave-de-Dosquet"], ["1922", "Bénédiction de l’ancienne église"], ["1996", "La municipalité devient Dosquet"], ["1998", "Aménagement de la piste cyclable"]],
  wiki: "https://fr.wikipedia.org/wiki/Dosquet_(Québec)"
}, {
  s: "sainte-croix",
  n: "Sainte-Croix",
  dans: "à Sainte-Croix",
  de: "de Sainte-Croix",
  type: "ville",
  arrT: "MRC",
  arr: "Lotbinière",
  zone: "Rive-Sud",
  d: "Chef-lieu de la MRC de Lotbinière, au bord du fleuve Saint-Laurent, à une cinquantaine de kilomètres à l’ouest de Québec. Les commerces se regroupent sur la rue Principale (route 132) et la route Laurier (route 271).",
  situe: "Rive-Sud, au bord du fleuve",
  chiffre: ["Locataires", "29,8 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Domaine Joly-De Lotbinière", "Église de Sainte-Croix", "Chute du Petit Saut"],
  vie: "Un centre de services régional au bord du fleuve, avec sa falaise, ses vues sur le Saint-Laurent et de nombreuses maisons anciennes. Au printemps et à l’automne, des milliers d’oies blanches s’arrêtent sur les battures.",
  log: "Surtout des maisons unifamiliales, mais aussi plusieurs petits immeubles à logements et des maisons patrimoniales. Au recensement de 2021, près de trois ménages sur dix étaient locataires.",
  pres: ["École secondaire Pamphile-Le May", "Centre culturel et sportif (aréna)", "Réserve écologique de la Pointe-Platon"],
  sav: "Les autobus d’Express Lotbinière s’arrêtent rue Gauthier et rejoignent Saint-Apollinaire, où une ligne mène au réseau de la STLévis. L’autoroute Jean-Lesage est à quelques kilomètres au sud, par la route 271.",
  hist: ["La seigneurie de Sainte-Croix est concédée en 1637 et réservée aux religieuses qui viendraient s’établir à Québec, les Ursulines. Le 14 septembre 1647, jour de l’Exaltation de la Sainte-Croix, le père Jérôme Lalemant en prend possession en leur nom, d’où le nom du lieu. Les premières terres sont accordées aux colons à partir de 1680, dont celle de Louis Houde en 1682.", "Une première chapelle est bâtie en 1694 près du fleuve, sur la terre de Louis Houde. Le chemin du Roy atteint la seigneurie en 1718, et Sainte-Croix devient une paroisse en 1721. Les colons s’installent ensuite en haut de la falaise, où une deuxième église ouvre au culte en 1739.", "En 1754, les Ursulines font bâtir un moulin à farine au pied de la chute du Petit Saut. En 1846, Pierre-Gustave Joly, seigneur de Lotbinière, achète des terres à Pointe-Platon et y fait construire en 1851 un manoir d’été, Maple House. La municipalité de paroisse voit le jour en 1855.", "L’église actuelle, la quatrième de la paroisse, est bénie le 3 septembre 1915. Le village se détache de la paroisse en 1921. Le transport par le fleuve cesse en 1926, avec le pavage de la route aujourd’hui appelée route Marie-Victorin (route 132), et le village et la paroisse se regroupent le 5 octobre 2001 pour former la municipalité actuelle."],
  portrait: ["Sainte-Croix s’étend sur une vingtaine de kilomètres le long du Saint-Laurent, de Pointe-Platon jusqu’au ruisseau Gaspard, au pied d’une falaise de plus de 50 mètres. Les commerces se concentrent sur la rue Principale et la route Laurier, ce qui en fait l’un des principaux centres de services de la MRC. On y trouve une épicerie, une pharmacie, une clinique médicale, un dentiste et des écoles primaire et secondaire.", "Selon le décret de population de 2026 du gouvernement du Québec, la municipalité compte 2 614 habitants. La fonderie Bibby-Ste-Croix et les Industries de la Rive-Sud, fabricant de meubles, y emploient à elles seules plus de 600 personnes. À Pointe-Platon, le Domaine Joly-De Lotbinière est un lieu historique national du Canada depuis 2003."],
  dates: [["1637", "Concession de la seigneurie de Sainte-Croix"], ["1721", "Érection de la paroisse"], ["1851", "Construction du manoir Joly-De Lotbinière"], ["1915", "Bénédiction de l’église actuelle"], ["2001", "Regroupement du village et de la paroisse"]],
  wiki: "https://fr.wikipedia.org/wiki/Sainte-Croix_(Québec)"
}, {
  s: "saint-sylvestre",
  n: "Saint-Sylvestre",
  dans: "à Saint-Sylvestre",
  de: "de Saint-Sylvestre",
  type: "ville",
  arrT: "MRC",
  arr: "Lotbinière",
  zone: "Rive-Sud",
  d: "Municipalité de collines et d’érablières à l’extrémité sud-est de la MRC de Lotbinière, sur les premiers contreforts des Appalaches. Les routes 216 et 269 la traversent.",
  situe: "Rive-Sud, dans les contreforts des Appalaches",
  chiffre: ["Locataires", "24,1 %", "des ménages étaient locataires au recensement de 2021"],
  rep: ["Mont Sainte-Marguerite (mont Radar)", "Pont couvert de la rivière Filkars", "Église de Saint-Sylvestre"],
  vie: "Un village de campagne entouré de collines et d’érablières, connu pour la qualité et la quantité de son sirop d’érable.",
  log: "Surtout des maisons unifamiliales, dont plusieurs maisons ancestrales bien conservées, avec quelques logements au village. Au recensement de 2021, environ un ménage sur quatre était locataire.",
  pres: ["École l’Astrale", "Cimetière anglican", "Sainte-Marie, à 23 km"],
  sav: "On se déplace surtout en voiture. Le CLSC le plus proche est à Sainte-Marie, en Beauce, à 23 km, et Thetford Mines est à 37 km.",
  hist: ["Le territoire fait partie de la seigneurie de Beaurivage, concédée le 1er avril 1738 à Gilles Rageot, négociant de Québec. L’ouverture du chemin Craig par l’armée, en 1810, puis celle du chemin de Sainte-Marie, carrossable dès l’été 1817, rendent la région accessible. En 1819, l’arpenteur Demers divise en lots le territoire le long du chemin Craig, et une cinquantaine de lots sont concédés dès 1820.", "Les colons sont d’origine canadienne-française, irlandaise, écossaise, anglaise et allemande. La paroisse est érigée canoniquement le 26 novembre 1828 et compte alors 700 habitants. Selon la tradition, on lui a donné le nom du dernier saint du calendrier, Sylvestre Ier, fêté le 31 décembre, parce que ces terres semblaient au bout du monde de la colonisation.", "La municipalité est érigée civilement le 11 juillet 1835, et son premier maire est élu en 1845. Une église remplace la première chapelle en 1862. Saint-Patrice se détache de Saint-Sylvestre en 1871, suivie de Saint-Séverin en 1872.", "Le 27 mai 1914, un incendie détruit l’église, reconstruite l’année suivante avec une partie des pierres d’origine. Un pont couvert est bâti sur la rivière Filkars en 1927. Dans les années 1950, en pleine guerre froide, l’Aviation royale canadienne installe une base radar au sommet du mont Sainte-Marguerite, en service jusqu’en 1964."],
  portrait: ["Saint-Sylvestre est la plus au sud des 18 municipalités de la MRC de Lotbinière. Avec environ 148 km², c’est la troisième plus grande de la MRC, et son relief de collines s’élève sur les premiers contreforts des Appalaches. Le mont Sainte-Marguerite, surnommé mont Radar, en est le plus haut sommet.", "Selon le décret de population de 2026 du gouvernement du Québec, elle compte 1 067 habitants. Les érablières couvrent une bonne partie du territoire, et plusieurs producteurs ont reçu le titre de Maître sucrier. Les rivières Beaurivage et Filkars arrosent les terres agricoles."],
  dates: [["1738", "Concession de la seigneurie de Beaurivage"], ["1828", "Érection canonique de la paroisse"], ["1835", "Érection civile de la municipalité"], ["1927", "Construction du pont couvert"], ["1964", "Fin des activités de la base du mont Radar"]],
  wiki: "https://fr.wikipedia.org/wiki/Saint-Sylvestre_(Québec)"
}];
const quartierDe = path => QUARTIERS.find(q => '/quartiers/' + q.s === path);
/* Bande pour la page Logements à louer : maillage vers les neuf guides. */
function BandeQuartiers() {
  return <Section fond="douce"><TitreBloc surtitre="Guides de quartier" titre="Choisir son quartier {à Québec}." texte="Repères, artères et logements à louer, quartier par quartier." action={<Fleche to="/quartiers">Toute la région</Fleche>} />
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px'
    }}>{QUARTIERS.filter(q => !q.type).map(q => <a key={q.s} href={"/quartiers/" + q.s} style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: '44px',
        padding: '0 18px',
        borderRadius: '10px',
        border: LIGNE,
        background: '#fff',
        fontSize: '14px',
        fontWeight: 600,
        color: 'var(--marine-900)',
        textDecoration: 'none'
      }}>{q.n}</a>)}</div></Section>;
}

/* Sélecteur de la grande région de Québec (page /quartiers, fusionnée le 12 oct. 2026 avec l'ancienne page « Grande région de Québec ») :
   recherche, zones, liste accessible au clavier, carte et aperçu du secteur (guide + page propriétaires).
   La carte est décorative (aria-hidden) : la liste de liens est la navigation réelle. */
const estLevis = q => q.s === 'levis' || q.arr === 'Ville de Lévis';
const ZTAB = [['Tous', () => true], ['Québec', q => (q.zone || 'Ville de Québec') === 'Ville de Québec'], ['Lévis', estLevis], ['Rive-Nord', q => q.zone === 'Rive-Nord'], ['Île d’Orléans', q => q.zone === 'Île d’Orléans'], ['Portneuf', q => q.zone === 'Portneuf'], ['Rive-Sud', q => q.zone === 'Rive-Sud' && !estLevis(q)]];
/* Page « Gestion immobilière » du secteur (propriétaires) : la sienne, sinon celle de son arrondissement ou de sa ville. */
const PROPRIO_PARENT = {
  limoilou: 'la-cite-limoilou',
  montcalm: 'la-cite-limoilou',
  'saint-roch': 'la-cite-limoilou',
  'saint-sauveur': 'la-cite-limoilou',
  'vieux-quebec': 'la-cite-limoilou',
  'sainte-foy': 'sainte-foy-sillery-cap-rouge',
  'sainte-foysillerycap-rouge': 'sainte-foy-sillery-cap-rouge',
  lebourgneuf: 'les-rivieres',
  desjardins: 'levis',
  'les-chutes-de-la-chaudiere-est': 'levis',
  'les-chutes-de-la-chaudiere-ouest': 'levis'
};
const pageProprio = s => {
  const p = '/gestion-immobiliere/' + (PROPRIO_PARENT[s] || s),
    r = LL_ROUTES.find(x => x.path === p);
  return r ? [p, r.fil[r.fil.length - 1][0]] : null;
};
const CSS_SEL = `
.sel-p{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1.4fr);gap:20px;padding:20px;border-radius:22px;background:#fff;border:1px solid rgba(12,33,71,.10);box-shadow:0 2px 4px rgba(12,33,71,.05),0 40px 80px -30px rgba(12,33,71,.30)}
.sel-in{width:100%;box-sizing:border-box;height:52px;padding:0 16px 0 46px;border-radius:12px;border:1px solid rgba(12,33,71,.16);background:#F5F8FC;font:400 14px var(--police-corps,Poppins);color:var(--marine-900);transition:border-color .2s,box-shadow .2s,background .2s}
.sel-in::placeholder{color:#6B7A8F}.sel-in:focus{outline:none;background:#fff;border-color:#4581CB;box-shadow:0 0 0 4px rgba(69,129,203,.18)}
.sel-z{display:flex;flex-wrap:wrap;gap:5px}
.sel-zb{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 10px;border-radius:10px;border:1px solid rgba(12,33,71,.14);background:#fff;font:600 12.5px var(--police-corps,Poppins);color:var(--marine-900);cursor:pointer;transition:background .2s,color .2s,border-color .2s}
.sel-zb b{font-size:11px;font-weight:600;color:#4581CB}.sel-zb:hover{border-color:#4581CB}
.sel-zb[aria-pressed="true"]{background:var(--marine-900);border-color:var(--marine-900);color:#fff}.sel-zb[aria-pressed="true"] b{color:#91B5E0}
.sel-zb:focus-visible,.sel-li a:focus-visible,.sel-pro:focus-visible{outline:2px solid #4581CB;outline-offset:2px}
.sel-l{list-style:none;margin:0;padding:0 6px 0 0;display:grid;max-height:620px;overflow:auto;scrollbar-width:thin}
.sel-li a{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;min-height:54px;padding:8px 14px;border-radius:10px;text-decoration:none;color:inherit;transition:background .2s}
.sel-li+.sel-li a{box-shadow:inset 0 1px 0 rgba(12,33,71,.07)}
.sel-li a[data-actif="true"]{background:#EEF4FB;box-shadow:none}
.sel-li .sel-fl{color:#91B5E0;transition:transform .25s,color .25s}.sel-li a[data-actif="true"] .sel-fl{color:#4581CB;transform:translateX(3px)}
.sel-dr{display:grid;gap:14px;align-content:start}
.sel-det{display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:18px;padding:20px 22px;border-radius:16px;background:#fff;border:1px solid rgba(12,33,71,.10);box-shadow:0 18px 36px -22px rgba(12,33,71,.30)}
.sel-det-d{display:grid;gap:10px;align-content:space-between}
.sel-ch{display:grid;gap:6px;padding:16px;border-radius:12px;color:#fff;background:radial-gradient(120% 90% at 100% 0%,rgba(69,129,203,.5),rgba(69,129,203,0) 60%),linear-gradient(135deg,#173A6E,#0C2147)}
.sel-go{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:0 16px;border-radius:12px;background:var(--marine-900);color:#fff;font-size:14px;font-weight:600;text-decoration:none;transition:background .2s,transform .2s}.sel-go:hover{background:#173A6E;transform:translateY(-1px)}.sel-go:focus-visible{outline:2px solid #4581CB;outline-offset:3px}
.sel-pro{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 12px;border-radius:12px;border:1px solid rgba(12,33,71,.16);font-size:12.5px;font-weight:600;line-height:1.3;color:var(--marine-900);text-decoration:none;text-align:center;transition:border-color .2s,background .2s}.sel-pro:hover{border-color:#4581CB;background:#F5F8FC}
@media (prefers-reduced-motion:no-preference){.sel-det{animation:sel-in .35s cubic-bezier(.2,.7,.2,1)}}
.sel-c{position:relative;aspect-ratio:860/849;min-height:0;border-radius:16px;overflow:hidden;background:linear-gradient(135deg,#EEF4FB,#DCE8F6)}
.sel-c>svg{position:absolute;inset:0;width:100%;height:100%}
.sel-pt{transition:r .3s,fill .3s,opacity .3s;cursor:pointer}
@media (prefers-reduced-motion:no-preference){@keyframes sel-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}.sel-halo{animation:sel-h 2s ease-out infinite;transform-box:fill-box;transform-origin:center}@keyframes sel-h{0%{transform:scale(.6);opacity:.9}100%{transform:scale(2);opacity:0}}}
@media (max-width:960px){.sel-p{grid-template-columns:minmax(0,1fr)}.sel-c{min-height:320px}}
@media (max-width:640px){.sel-dr{display:none}}
@media (max-width:640px){.sel-c{display:none}.sel-l{max-height:min(60vh,520px)}}`;
/* Carte régionale (12 oct. 2026) : tracés OpenStreetMap (© contributeurs OpenStreetMap, ODbL) projetés et simplifiés une fois,
   intégrés au site (aucune requête externe). Vue de la région (50 km) et médaillon « Québec et Lévis » pour le secteur central;
   un lieu dont pts a quatre valeurs est dessiné dans le médaillon; « mer » = estuaire à l’est de l’île d’Orléans (traits de côte). */
const CARTE_QC = {
  "m": {
    "W": 860,
    "H": 849,
    "mer": "M754 246L768 230L766 227L752 237L752 241L757 241L754 246ZM760 219L756 226L761 220L760 219ZM758 221L758 221L758 221ZM1042 -9L1020 24L1021 33L1016 37L1018 42L1014 53L994 74L990 87L977 101L976 108L974 106L972 109L972 114L968 118L969 120L961 124L942 144L935 142L937 147L932 151L931 157L887 205L883 218L876 223L879 229L875 236L856 254L830 265L830 272L828 268L813 267L792 274L790 270L753 251L744 229L714 185L721 175L732 166L743 143L750 138L757 119L779 88L788 63L808 40L817 24L820 14L819 7L821 -5L829 -26L842 -48L858 -65L861 -74L863 -95L858 -103L866 -113L863 -123L866 -116L869 -118L874 -114L888 -109L929 -132L1275 -132L1275 -9ZM813 213L813 218L815 217L813 213ZM789 209L786 211L782 209L782 212L783 215L789 209ZM766 222L768 220L766 222ZM794 217L787 223L786 230L779 235L788 231L794 217ZM765 233L765 234L765 233ZM776 235L772 237L776 235ZM768 228L768 229L768 228ZM773 223L770 226L773 223ZM770 226L769 227L770 226ZM784 227L785 226L784 227ZM765 222L766 220L765 222ZM775 218L776 218L775 218ZM808 220L811 218L809 217L806 220L808 220ZM799 220L800 219L799 220ZM789 209L789 208L789 209ZM790 208L792 206L790 208ZM795 221L795 221L795 221ZM805 194L807 192L805 194ZM798 195L797 196L798 195ZM816 216L816 216L816 216ZM825 182L821 190L827 184L828 177L825 182ZM842 161L843 160L842 161ZM849 157L849 156L849 157ZM877 226L877 226L877 226ZM904 116L907 112L899 120L897 119L899 116L879 131L878 136L868 138L870 140L866 140L856 149L855 155L851 156L852 162L848 170L837 182L837 195L827 209L815 225L830 221L837 215L851 194L847 182L853 168L871 148L881 144L883 140L892 133L904 116ZM872 134L872 134L872 134ZM874 132L874 132L874 132ZM875 131L875 131L875 131ZM876 132L876 131L876 132ZM869 136L869 136L869 136ZM870 136L870 135L870 136ZM795 120L796 120L795 120ZM796 120L796 120L796 120Z",
    "eau": "M638 947L627 951L618 971L613 972L612 976L617 979L616 984L619 983L620 986L615 990L614 987L611 989L612 993L608 994L609 996L603 1004L607 1012L603 1021L610 1046L616 1056L616 1063L622 1070L617 1080L614 1097L616 1106L613 1112L615 1110L614 1097L621 1069L616 1063L616 1056L610 1046L603 1021L607 1011L603 1003L609 997L608 994L613 993L611 989L614 987L616 990L620 986L619 982L616 984L617 979L613 975L613 973L618 971L627 952L640 948L643 940L646 939L646 936L654 929L653 924L660 917L658 908L667 897L661 903L657 909L660 917L653 924L653 929L645 936L646 938L642 940L640 947L638 947ZM100 693L96 692L97 690L91 690L90 692L87 687L82 689L83 684L79 685L78 682L73 681L70 675L67 677L70 672L68 669L64 672L66 668L62 666L65 664L60 660L63 657L56 658L59 652L52 656L50 652L47 652L38 645L30 647L26 644L23 650L18 648L16 651L14 649L10 653L1 643L-4 647L-7 644L-8 647L-11 645L-13 648L-11 640L-18 640L-24 630L-23 635L-20 636L-17 641L-11 640L-13 648L-10 645L-8 648L-7 645L-3 647L0 644L10 653L13 650L17 651L18 648L24 651L26 644L29 647L38 645L46 652L50 652L52 656L59 652L56 658L62 658L60 660L64 664L62 666L66 668L63 669L64 672L68 669L69 672L67 677L70 676L73 681L80 685L83 684L81 689L87 688L90 693L91 690L97 690L95 693L101 696L95 701L93 699L94 702L89 702L86 708L79 707L81 713L79 716L88 726L86 733L91 736L92 746L99 750L103 756L101 760L108 768L114 765L116 767L133 770L142 761L151 761L142 761L133 770L116 767L114 765L109 768L107 767L108 765L105 766L101 759L103 755L99 749L97 750L98 748L96 749L93 746L91 736L86 733L89 726L79 716L82 713L80 713L79 707L88 708L89 702L94 702L93 699L95 701L100 699L102 696L100 693ZM341 374L350 384L356 385L361 397L359 407L366 406L366 410L374 414L375 426L377 424L379 427L382 424L382 427L392 424L397 427L403 422L404 426L409 427L421 419L422 413L430 417L435 414L430 416L421 411L421 419L416 420L410 426L404 426L402 422L397 427L393 427L392 424L382 427L382 424L379 427L378 424L375 425L374 414L368 411L365 406L359 406L361 397L356 385L349 384L342 375L342 367L346 363L344 362L348 359L348 355L353 354L351 350L347 350L349 343L344 339L345 338L343 337L344 339L349 343L347 350L351 350L353 354L347 356L348 359L343 362L346 363L342 367L341 374ZM788 314L804 306L808 309L819 302L821 299L819 297L827 283L827 278L831 275L830 272L831 275L826 278L818 302L808 309L804 305L793 313L788 312L788 319L784 315L780 319L781 323L773 325L774 333L769 330L760 340L759 347L754 351L751 350L742 359L737 359L738 365L724 377L719 394L708 408L707 414L715 420L718 428L724 428L719 435L719 440L726 444L728 453L733 457L742 464L751 460L757 463L760 470L771 478L772 484L777 488L782 486L796 498L805 495L809 498L820 491L826 494L825 497L827 492L843 490L852 480L857 480L859 474L874 467L877 464L874 460L878 461L883 453L883 442L894 434L883 442L881 458L874 462L877 464L870 470L859 474L854 482L852 480L844 489L825 493L819 491L809 498L805 495L796 497L795 495L792 496L782 486L777 487L772 483L771 477L762 471L757 463L748 459L742 463L733 457L729 453L727 444L721 439L720 435L724 428L718 427L714 419L707 414L709 411L707 410L718 396L724 377L739 364L738 367L737 359L742 360L751 350L754 352L758 348L761 344L760 340L769 330L772 333L775 332L773 325L781 324L781 319L785 315L788 319L788 314ZM671 151L651 161L647 182L641 185L643 189L636 196L636 201L630 200L627 206L633 217L630 222L632 221L633 217L631 216L628 204L632 200L636 201L636 196L643 189L642 185L647 182L651 161L675 151L680 144L686 144L679 144L682 124L686 116L672 89L677 83L674 76L680 72L679 65L674 62L680 48L690 39L690 35L693 34L704 16L710 12L710 7L724 -6L726 -15L719 -22L708 -25L705 -29L705 -42L699 -51L700 -56L695 -72L681 -145L673 -164L668 -167L669 -171L668 -169L681 -145L683 -126L689 -110L691 -88L700 -56L699 -51L704 -43L705 -29L708 -24L719 -21L726 -14L723 -10L724 -5L710 6L710 12L704 16L690 35L690 38L679 48L674 62L679 65L680 72L673 76L676 82L672 89L686 117L682 124L678 145L671 151ZM57 260L60 257L58 254L64 250L62 250L61 240L57 244L58 238L52 239L56 234L53 231L58 228L54 226L50 218L43 215L43 210L35 202L32 196L37 182L35 182L33 201L43 210L42 216L50 219L53 226L58 228L53 230L56 235L53 234L52 239L58 239L57 244L60 240L61 250L64 250L58 254L60 257L57 260ZM397 519L399 526L413 523L425 536L427 544L410 559L421 570L422 575L419 581L421 585L425 585L416 601L419 607L435 615L437 630L444 646L454 652L469 654L473 663L487 672L495 670L502 689L512 695L516 694L517 689L519 690L528 723L540 741L552 751L563 769L578 774L592 792L609 806L608 834L618 846L629 854L638 878L654 880L661 890L667 894L666 909L676 916L677 926L680 931L695 941L698 953L709 957L719 952L727 958L731 969L733 1000L733 996L736 1009L741 1016L746 1016L759 1025L764 1032L764 1039L770 1045L767 1071L772 1046L764 1039L765 1033L761 1026L751 1019L746 1015L741 1015L736 1008L734 996L736 988L732 977L734 971L728 956L718 951L710 955L698 951L695 940L681 932L677 925L677 916L667 909L669 902L668 893L661 889L654 879L639 878L628 852L609 834L609 805L593 792L579 774L564 768L552 750L540 741L530 723L530 715L523 706L521 690L517 688L512 694L504 688L495 669L485 668L475 662L474 656L466 650L456 650L446 645L436 615L416 601L426 585L422 583L426 577L420 566L415 564L414 555L428 544L426 534L415 523L399 524L400 520L398 518L398 509L394 505L394 495L396 489L403 486L401 484L399 484L400 486L396 488L393 494L393 504L395 506L397 519ZM769 1127L762 1107L762 1087L766 1083L761 1087L762 1110L769 1127L766 1131L764 1145L769 1183L767 1187L780 1208L779 1227L786 1233L778 1238L780 1241L771 1256L776 1263L774 1269L778 1278L785 1289L778 1297L778 1302L772 1297L767 1298L769 1303L763 1314L760 1329L756 1332L756 1336L746 1343L744 1350L739 1348L735 1350L734 1354L728 1356L726 1367L721 1366L717 1379L714 1377L709 1380L705 1378L706 1385L701 1386L696 1395L690 1394L691 1401L687 1399L683 1404L688 1405L684 1411L686 1415L682 1423L683 1427L679 1427L677 1432L665 1443L648 1444L651 1449L648 1454L650 1457L645 1466L649 1474L644 1474L649 1482L643 1489L638 1488L637 1494L633 1497L637 1494L638 1488L644 1489L650 1482L644 1473L649 1474L645 1466L648 1463L651 1450L648 1444L669 1442L677 1462L676 1455L668 1443L679 1428L683 1427L683 1419L687 1417L684 1412L688 1405L684 1404L687 1399L691 1402L690 1394L696 1396L702 1387L706 1385L705 1378L709 1381L714 1377L717 1379L717 1375L722 1372L722 1366L727 1367L729 1356L733 1355L737 1349L744 1350L746 1344L756 1337L756 1332L761 1329L763 1316L770 1303L768 1298L778 1302L779 1297L786 1289L784 1282L778 1278L775 1269L777 1263L772 1256L781 1241L778 1238L786 1233L780 1226L780 1208L775 1202L770 1188L765 1145L766 1132L769 1127ZM523 406L508 409L496 406L479 409L472 409L471 405L466 406L466 404L454 417L449 441L445 442L447 446L440 450L443 452L441 455L422 466L414 475L399 484L393 482L374 490L367 494L362 502L328 516L300 517L294 521L273 526L268 531L265 530L255 538L235 547L217 548L208 553L189 570L171 578L124 583L118 581L118 578L115 581L108 582L84 573L61 546L49 550L34 565L20 586L-6 596L-28 625L-25 630L-32 630L-38 639L-51 643L-59 640L-71 641L-77 644L-93 640L-127 660L-141 680L-152 687L-162 735L-169 746L-169 754L-178 765L-185 766L-203 775L-212 776L-213 774L-226 783L-232 780L-232 783L-235 781L-238 785L-240 782L-252 786L-250 781L-255 780L-254 775L-257 787L-261 787L-270 795L-287 800L-288 804L-290 803L-288 799L-296 801L-297 805L-310 814L-329 834L-335 837L-337 835L-364 869L-397 890L-404 903L-410 905L-409 901L-416 907L-415 910L-425 886L-399 873L-383 870L-374 866L-344 825L-330 819L-319 799L-312 792L-276 772L-257 767L-245 752L-235 746L-204 742L-188 736L-185 729L-178 696L-172 685L-173 678L-165 668L-159 654L-150 652L-149 647L-137 643L-139 643L-132 636L-137 637L-131 635L-135 634L-107 623L-106 625L-106 623L-101 624L-99 622L-97 625L-98 623L-93 623L-93 620L-90 621L-86 616L-88 620L-82 620L-81 617L-82 620L-77 620L-76 616L-72 627L-72 622L-67 625L-70 620L-66 622L-66 619L-61 620L-63 619L-60 618L-53 619L-33 595L-23 586L6 567L13 567L30 535L39 530L43 536L40 529L51 530L63 527L75 532L95 546L106 548L120 544L121 547L142 546L152 548L162 542L168 541L176 533L182 535L182 531L189 526L202 522L214 524L222 523L231 514L245 508L306 494L311 491L344 491L353 486L360 478L376 476L390 478L402 472L409 464L420 457L424 446L425 448L425 444L430 443L429 440L443 428L446 417L443 415L446 417L447 411L445 414L435 414L449 405L448 400L441 401L443 391L445 389L456 388L463 383L472 374L472 369L481 357L523 327L528 321L528 319L529 321L532 318L536 307L561 280L559 278L562 279L574 270L587 253L605 242L608 244L610 239L629 229L631 223L634 225L663 217L678 217L705 188L714 185L744 229L753 251L790 270L792 274L784 277L734 316L726 315L726 312L720 316L720 320L717 318L709 324L708 333L701 341L690 341L685 332L665 350L658 360L647 360L647 354L643 356L640 352L619 366L617 364L617 367L605 370L594 384L571 403L558 406L545 403L540 405L532 401L532 404L523 406ZM733 239L717 248L706 259L730 244L733 239ZM683 238L668 243L656 239L603 261L584 280L562 309L552 317L534 327L519 343L505 353L506 354L493 367L480 391L486 394L492 390L529 390L539 383L546 385L559 381L562 383L589 354L589 350L597 349L604 344L603 342L613 340L629 330L656 290L655 286L664 281L674 264L677 263L680 249L684 242L683 238ZM680 293L694 283L694 279L691 278L680 293ZM56 358L51 363L48 379L44 381L45 387L41 389L46 400L44 401L40 395L18 400L7 398L0 404L-4 400L-6 407L-18 419L-23 419L-32 426L-34 432L-29 439L-32 442L-39 440L-41 442L-40 444L-46 448L-43 459L-50 461L-48 465L-38 462L-37 466L-46 470L-49 466L-55 469L-62 481L-61 486L-69 494L-67 502L-72 503L-75 511L-83 517L-86 517L-88 532L-85 538L-92 540L-92 547L-102 550L-113 561L-115 560L-113 560L-113 566L-118 572L-121 572L-125 575L-152 585L-153 601L-163 616L-163 622L-160 624L-153 628L-154 644L-149 649L-153 644L-152 627L-163 619L-152 605L-151 586L-133 580L-122 572L-117 573L-113 567L-112 559L-92 548L-92 541L-85 539L-88 527L-85 518L-74 511L-72 504L-66 502L-68 495L-60 487L-55 470L-50 467L-46 471L-36 466L-38 462L-47 465L-50 460L-43 459L-46 451L-40 444L-41 442L-33 443L-28 439L-30 433L-30 435L-32 434L-32 427L-23 419L-17 419L-5 407L-5 400L1 404L6 399L11 401L40 396L46 401L47 397L41 390L46 387L48 375L52 368L51 364L57 363L57 360L57 362L54 361L56 358ZM-142 957L-148 953L-150 960L-154 956L-161 958L-179 948L-189 951L-197 958L-201 950L-206 947L-214 948L-225 942L-226 930L-230 920L-240 910L-236 906L-241 904L-248 908L-250 906L-253 887L-248 882L-253 874L-257 873L-258 854L-272 840L-276 841L-280 836L-291 831L-292 824L-291 822L-292 826L-290 827L-291 822L-287 816L-292 809L-292 801L-294 804L-296 801L-288 816L-293 824L-293 831L-293 828L-277 842L-273 841L-259 855L-261 863L-258 873L-254 874L-249 882L-254 887L-251 906L-248 909L-241 905L-236 906L-240 911L-232 918L-227 930L-225 943L-215 948L-206 947L-201 950L-197 958L-188 951L-179 949L-150 960L-148 954L-140 958L-136 951L-137 946L-131 946L-126 940L-114 940L-111 949L-101 957L-97 956L-90 959L-86 952L-87 946L-76 936L-75 931L-70 930L-71 924L-61 923L-52 910L-40 910L-27 914L-14 909L-7 901L-4 904L4 903L17 890L17 882L24 875L39 870L42 864L65 854L70 848L80 845L95 849L114 843L116 837L133 838L140 831L155 828L187 810L218 804L221 814L235 815L231 825L236 831L241 831L255 842L277 847L292 854L298 851L300 859L292 866L294 870L279 881L281 892L275 899L269 900L274 906L273 913L269 918L267 917L265 925L257 927L253 930L261 925L264 927L267 917L269 919L274 912L275 906L269 900L275 899L282 892L279 882L295 870L293 866L300 860L299 851L292 853L277 846L255 842L242 830L237 830L232 826L235 815L223 814L219 804L212 804L206 808L200 806L188 808L181 814L163 821L155 827L140 831L131 837L115 836L111 843L96 848L81 844L70 848L65 853L41 863L38 869L22 875L17 882L16 889L12 891L6 901L-3 904L-7 901L-21 912L-28 914L-40 909L-52 910L-61 922L-72 925L-69 919L-73 923L-70 929L-75 930L-76 936L-88 945L-88 956L-90 958L-106 950L-115 939L-127 940L-131 944L-137 946L-137 952L-142 957ZM-104 951L-98 955L-99 957L-107 951L-111 946L-104 951ZM458 341L458 344L463 343L467 352L473 351L479 360L475 352L467 351L462 342L467 324L465 322L456 329L452 327L455 330L461 324L466 324L463 336L458 341ZM449 314L448 325L452 328L449 323L451 310L440 284L448 277L448 268L449 264L456 260L448 264L448 277L440 284L441 294L450 308L449 314ZM512 152L498 173L494 172L469 195L468 200L474 217L468 234L459 237L457 252L455 260L457 259L457 247L460 238L468 235L469 228L474 217L469 196L495 173L499 173L512 152ZM506 106L482 95L470 83L468 74L469 83L473 88L481 92L484 97L497 101L509 110L520 126L524 127L525 131L512 152L526 131L525 127L520 126L516 117L506 106ZM131 260L125 264L117 265L110 275L103 279L103 283L94 302L85 311L86 314L104 280L111 275L114 269L117 265L137 259L140 248L143 248L156 234L155 229L160 219L163 218L171 209L179 208L173 207L168 209L164 205L167 196L173 192L182 173L173 192L167 195L164 206L168 209L163 214L164 218L157 221L152 231L154 235L140 247L137 259L131 260ZM523 530L509 546L520 552L520 556L524 556L521 562L526 571L544 578L580 583L582 588L597 590L599 596L597 601L611 611L619 610L622 613L650 610L664 615L669 623L665 642L672 650L670 647L678 651L678 656L690 660L689 672L695 680L720 689L729 699L733 700L745 693L761 688L773 700L775 705L777 702L783 705L782 709L786 709L785 711L792 715L790 717L795 723L789 733L791 739L787 746L788 755L773 779L774 785L778 787L777 791L779 789L781 791L782 787L784 791L793 789L794 783L796 785L803 781L815 771L820 762L826 760L836 741L842 744L845 728L858 724L861 716L868 715L875 707L883 708L890 703L892 696L898 695L897 697L898 694L892 696L890 703L883 708L875 707L868 715L860 716L858 724L846 728L842 743L836 741L828 756L821 762L803 781L796 785L794 783L792 789L785 791L782 787L781 791L779 789L777 791L778 787L774 785L774 779L788 755L789 733L795 723L791 717L792 715L785 711L786 709L782 709L783 705L777 702L775 704L773 699L761 688L756 688L751 693L744 693L734 700L729 699L720 689L696 680L690 672L690 660L678 655L678 650L665 641L670 623L664 614L650 609L622 613L619 610L611 610L597 599L600 596L597 590L585 588L579 582L559 581L532 574L522 563L524 556L520 556L520 552L509 545L518 538L524 529L522 525L514 525L513 519L498 509L493 509L493 505L485 499L481 491L473 483L462 485L456 481L450 481L439 484L435 475L439 470L426 467L438 470L434 476L439 485L450 482L462 485L473 483L489 503L490 509L490 504L493 509L498 510L512 520L513 526L520 525L523 530ZM251 368L251 375L231 381L216 390L191 390L193 393L219 391L222 388L228 387L232 381L237 382L245 376L252 375L254 361L251 353L260 347L263 340L264 330L260 327L264 314L267 309L271 309L273 304L281 307L284 305L276 292L278 281L272 276L270 267L274 266L276 260L277 251L274 251L271 247L274 245L281 220L292 214L306 215L310 212L311 194L320 186L330 186L335 183L342 165L351 156L349 139L355 135L354 129L350 117L332 88L314 43L329 84L350 119L354 130L354 135L349 139L348 147L350 155L341 165L335 182L329 186L319 185L311 193L309 213L300 215L293 214L290 217L283 217L278 222L279 228L273 245L271 246L277 253L274 263L270 266L270 272L272 278L277 279L275 292L279 301L283 303L280 306L272 303L271 308L267 308L263 315L259 327L263 330L263 341L254 353L250 351L249 353L253 361L251 368ZM142 478L147 484L152 482L154 496L142 500L141 509L128 518L126 524L119 525L123 530L124 538L121 540L118 537L120 543L117 537L123 538L123 532L119 524L125 523L128 517L141 509L142 499L154 495L151 491L152 482L147 484L142 478ZM149 474L148 469L151 467L148 461L161 448L164 442L164 435L182 422L165 432L162 436L163 444L157 453L149 457L146 462L150 467L148 468L149 473L142 478L149 474ZM351 585L352 580L368 575L366 573L374 573L375 570L370 570L379 565L389 563L394 554L408 548L409 541L402 527L409 541L408 547L394 553L389 563L385 562L370 570L374 570L373 572L367 572L368 575L352 580L351 586L347 588L349 592L345 598L347 608L353 609L348 616L353 623L347 628L354 639L350 651L346 655L346 665L351 672L344 678L349 685L361 689L362 694L357 696L362 699L359 707L370 715L369 724L371 727L367 729L367 738L379 756L387 759L388 762L397 761L397 763L413 770L429 770L413 770L397 763L398 761L395 760L388 762L388 759L379 756L374 746L369 743L371 741L367 739L366 733L367 729L372 727L369 725L370 715L360 707L362 699L357 695L362 692L357 685L349 685L344 678L351 672L346 665L346 655L350 651L354 639L347 629L353 623L348 616L354 609L347 607L345 602L350 592L348 588L351 585ZM193 412L195 407L189 400L193 392L188 399L194 408L192 411L180 422L193 412ZM56 358L60 349L54 344L53 340L55 324L57 327L62 324L61 314L60 318L61 324L57 327L55 324L53 338L54 344L60 349L54 356L56 358Z",
    "riv": [{
      "n": "Rivière Montmorency",
      "d": "M502 -219L489 -183L479 -174L476 -165L452 -127L453 -122L448 -122L441 -113L449 -101L474 -47L479 -45L483 -37L481 -19L485 -12L483 1L485 14L482 40L468 75L469 83L483 96L509 108L525 130L498 173L494 173L469 195L474 218L468 234L459 239L457 259L448 264L448 278L440 284L449 305L449 326L456 329L461 324L467 324L461 343L467 351L475 352L479 359M445 297L444 296M444 297L440 293L441 289M446 299L449 307"
    }, {
      "n": "Rivière du Berger",
      "d": "M382 347L382 347M384 412L385 413M383 412L384 412M383 412L383 412M382 348L384 349M385 353L385 353M384 349L384 349M382 344L381 345M384 349L384 349M385 354L385 355M385 352L385 352M384 349L385 352M384 349L384 349M381 346L382 347M385 352L385 352M382 347L382 348M387 358L391 372L378 373L370 387L375 395L378 407L383 412M385 353L385 354M381 345L381 346M384 342L382 344M386 414L386 414M385 413L385 413M385 413L386 413M386 413L386 414M389 417L387 418L389 420M384 341L384 342M384 342L384 342M384 341L384 341M384 339L384 341M384 339L384 339M384 335L384 339M385 355L387 358M387 358L387 358M389 420L390 422L386 425M389 420L389 420M385 352L385 353M385 352L385 352M386 414L389 417M389 417L389 417"
    }, {
      "n": "Rivière Jacques-Cartier",
      "d": "M281 220L280 226M275 263L272 266M278 295L279 299M222 387L227 386M142 476L142 478M208 390L205 389L203 392M343 108L352 126M310 206L310 212L306 214L292 214L282 218L279 222L280 228L277 232M253 353L250 353L254 361L251 375L232 381L226 388L192 393L189 400L195 407L194 411L178 426L163 435M163 435L164 442L157 454L150 457L148 463L151 467L148 470M148 470L148 474L142 476M142 478L148 484L152 482L151 485M140 510L128 517L125 524L119 525L123 530L121 539M353 136L349 138L350 145M349 146L350 155L346 162M341 168L341 168M354 135L353 136M320 186L311 194L310 206M352 126L353 129M344 163L341 168M350 145L349 146M341 168L338 174M346 162L344 163M338 174L337 178M353 129L354 135M277 232L274 245L271 247L277 253L275 265L271 266L270 269L272 277L277 280L276 292L284 304L281 307L273 303L271 308L266 309L260 326L263 329L263 340L253 353M142 506L140 510M153 493L153 497L148 496L142 500L142 506M151 485L153 493M120 544L120 564M337 178L332 185L327 186M321 187L320 186M310 207L310 210M327 186L321 187M321 187L320 186M320 186L320 186M121 539L118 538L120 544M121 539L121 539M347 115L350 119M294 -22L292 -14M291 -5L295 2L304 7L320 62M291 -10L291 -8M292 -14L292 -13M292 -13L291 -11M291 -11L291 -11M291 -11L291 -10M291 -8L292 -9M331 86L343 108M330 86L331 86M328 78L330 86M327 77L328 78M327 76L327 77M323 69L327 76M320 62L321 63M321 63L323 67M323 67L323 69M292 -9L291 -6M291 -6L291 -5"
    }, {
      "n": "Rivière Beaurivage",
      "d": "M499 854L495 842L495 831L492 829L494 821M494 821L493 806L498 797L496 792L487 786L480 788L466 784L454 764L447 763L435 771L427 769L413 770L397 763L397 761L388 762L388 759L379 756L367 739L367 729L371 727L369 725L370 715L359 707L362 699L357 695L361 694L361 689L349 685L344 678L351 672L346 665L346 654L351 648L350 645L354 638L347 628L353 623L348 616L353 609L346 605L345 597L350 592L348 588L351 585L352 580L368 575L366 573L374 572L375 570L370 570L380 564L384 565L385 562L389 563L389 560L394 553L408 548L409 542L402 526"
    }, {
      "n": "Rivière Boyer",
      "d": "M574 506L577 503M577 503L577 503M585 495L589 487L588 482L590 483L589 480L594 478L592 476L596 473L598 464L607 451L605 449L608 448L606 446L613 439L611 436L614 436L617 428L619 430L623 426L621 416L624 416L623 413L626 408L623 406L630 399L628 396L633 391L632 389L636 388L635 383L640 382L642 378L639 376L644 374L647 366L650 365L647 359M577 503L585 495"
    }, {
      "n": "Rivière Nelson",
      "d": "M290 336L286 351L287 362L290 367L321 379L329 377M329 377L337 373L342 374M329 377L329 377M306 285L306 285M291 305L301 318L302 326L299 330M299 330L299 330M299 330L296 330M296 330L296 330M296 330L291 330L290 336M290 336L290 336M291 304L291 305M291 304L291 304"
    }, {
      "n": "Rivière Etchemin",
      "d": "M929 646L930 654L928 661L917 672L907 691L899 697L898 695L892 696L890 703L883 708L875 707L868 715L861 716L858 724L845 728L842 743L835 742L828 756L820 762L815 771L796 785L794 783L793 789L784 791L782 787L781 791L779 789L777 791L778 787L774 785L774 779L788 755L789 733L795 723L790 717L792 715L785 711L786 709L782 709L783 705L777 702L775 704L773 700L761 688L745 693L734 700L729 699L720 689L695 680L690 672L690 660L678 656L678 650L670 647L665 642L670 624L664 614L651 610L622 613L620 610L611 611L597 600L599 596L597 590L585 588L579 583L559 581L532 574L522 564L524 556L520 556L520 552L509 545L518 538L524 529L522 526L514 526L511 522L512 519L498 509L492 508L473 483L463 485L446 482M446 482L440 485L438 483M438 483L435 476L438 470L427 468L426 465"
    }, {
      "n": "Rivière Sainte-Anne",
      "d": "M75 339L79 342L77 345M89 306L85 308L85 312M143 247L140 251M47 378L45 387L41 389L46 396L46 401L39 396L17 400L6 399L0 404L-5 400L-5 406L-10 412L-19 420L-23 419L-32 426L-33 432L-29 439L-33 443L-41 442L-40 444L-46 449L-43 459L-50 460L-48 465L-39 462L-37 466L-46 471L-49 467L-55 469L-61 486L-69 495L-67 502L-72 504L-75 510L-86 517L-88 532L-85 538L-92 540L-93 548L-111 558L-113 566L-118 572L-122 572L-126 576L-152 586L-153 602L-164 620L-153 627L-154 643L-149 648M742 -368L746 -362L745 -352L747 -350L726 -341L725 -337L714 -327L697 -329L695 -311L697 -302L694 -298L697 -290L703 -288L700 -283L703 -249L693 -239L684 -216L681 -198L683 -190L668 -169L681 -145L684 -126L689 -110L691 -88L700 -57L699 -51L704 -43L705 -29L708 -25L718 -22L726 -14L724 -5L710 6L710 12L680 48L677 60L674 62L679 65L680 72L673 76L677 83L672 89L686 118L682 123L678 146L668 155L664 154L658 160L652 161L647 182L642 184L643 189L636 196L636 201L632 200L628 203L627 207L633 217L631 222L633 231M78 326L75 335M182 52L186 50L186 54L196 56L198 59L197 70L200 75L201 85L193 111L189 143L184 151L186 156L182 172L173 192L167 195L164 206L168 209L164 218L158 220L154 235L140 247L136 260L117 265L104 280L73 337L77 346L68 353M68 353L66 356L57 357L51 364L51 370L47 378M170 31L171 37M171 41L173 39L173 43"
    }, {
      "n": "Rivière Portneuf",
      "d": "M105 350L107 361L111 366L105 380L108 388L114 391L106 396L102 402L113 413L111 417L118 419L116 421L120 429M120 429L127 438L126 444L124 443L123 446L119 446M119 446L112 450L105 449L95 452L85 466L83 471L85 477L75 477L70 489L62 493L65 498L51 503L46 506L47 513L39 515L41 529M115 328L105 345L105 350M105 350L105 350M41 529L50 539"
    }, {
      "n": "Rivière du Sud",
      "d": "M942 397L915 410L914 415L883 442L881 458L874 462L877 464L870 470L861 473L857 480L852 480L842 490L825 493L819 491L809 498L805 495L796 497L782 486L777 488L771 478L760 470L757 463L751 460L741 463L729 454L727 444L719 437L724 428L718 428L715 420L707 414L708 408L718 396L724 376L738 365L737 359L742 359L751 350L754 351L758 348L760 340L769 330L774 333L773 325L782 323L781 318L784 316L788 319L788 313L793 313L804 306L808 309L820 300L819 296L823 292L830 271"
    }, {
      "n": "Rivière Saint-Charles",
      "d": "M344 365L342 375L349 384L356 385L361 397L359 406L367 406L366 410L374 414L375 425L377 424L379 427L383 424L382 427L392 424L397 427L403 422L404 426L410 426L420 420L422 413L430 417L435 415M343 337L349 343L347 350L351 350L353 354L347 356L348 359L344 362L344 365M435 415L456 407"
    }, {
      "n": "Rivière Chaudière",
      "d": "M423 591L426 586L421 584L422 570L413 560L414 554L426 545L425 534L414 523L401 526L398 525L399 521L393 504L393 496L396 489L401 486L399 484M668 896L653 879L639 878L629 853L609 835L609 806L593 792L580 775L563 768L551 750L540 741L529 724L519 689L517 689L512 695L503 688L495 669L487 671L474 663L469 653L456 651L446 646L435 615L420 607L416 601L423 591"
    }],
    "aut": "M416 493L428 487M362 318L361 330M363 336L362 320M462 383L449 389M497 343L491 347M469 374L473 368M362 320L355 307M379 357L376 351M321 381L311 374M297 367L288 364M329 395L338 408M393 438L405 437M396 387L400 392M396 386L388 373M376 352L379 357M530 314L539 300M391 477L394 484M187 657L208 648L227 627M416 550L409 534M410 539L414 546M505 679L512 684M690 907L683 901M681 892L683 900M380 361L387 372M294 466L308 471M387 413L390 418M396 500L399 512M355 307L362 318M355 307L348 281M570 268L559 278M603 243L594 248M702 131L707 122M295 572L261 591M296 572L322 559M696 914L701 920M18 838L-39 893M72 782L99 752M99 752L77 773M122 729L130 721M545 718L536 693L524 686M551 731L562 745M566 748L603 770M603 770L618 784M633 830L642 846M626 793L629 801M648 859L667 869M322 558L296 572M412 494L394 501M513 684L505 678M404 523L399 510M524 686L535 693L544 718M452 476L439 482M562 418L574 419L602 401M227 627L207 648L187 657M261 591L296 572M-17 561L5 551L17 531L38 521M38 521L24 524L6 550L-18 561M39 521L62 517L89 531L117 533M117 532L87 530L62 517L39 520M132 531L124 532M132 532L156 525M155 525L133 531M159 523L167 517M167 517L178 512M167 517L158 523M247 481L277 472M209 501L191 507M559 279L554 286M559 279L571 268M842 281L833 286M863 268L914 227M833 287L843 281M813 290L786 297L708 361L686 372M686 373L717 356L786 298L813 290M650 372L657 372M913 227L862 267M311 374L302 369M322 473L316 474M370 338L375 341L376 351M-46 900L18 838M377 416L389 411M359 166L369 157M374 144L388 137M182 510L207 502M452 388L464 381M399 437L393 438M393 485L390 477M390 477L393 485M497 343L508 336M369 156L359 166M347 275L355 307M369 225L355 207L357 178M348 275L354 256M290 466L246 481M281 470L294 465M354 256L347 275M369 225L368 235L354 256M355 253L368 235L369 225M630 801L626 793M629 801L633 829M407 401L412 410M645 853L648 859M327 471L338 465M386 439L392 438M395 408L378 415M347 413L331 398M343 412L358 419M357 178L355 207L369 225M347 458L343 462M436 408L440 399M387 372L380 360M390 377L396 386M620 786L604 770M121 730L100 751M100 751L122 730M129 721L122 729M575 753L567 748M676 874L667 869M633 829L630 801M549 727L545 718M562 743L551 730M716 928L722 934M716 927L702 920M722 933L716 928M644 848L633 830M681 892L678 876M679 880L681 892M683 901L688 906M683 899L681 892M242 612L258 594M258 594L241 612M241 612L227 627M227 627L241 612M563 418L516 421M657 372L650 372M659 372L668 372M668 372L659 372M486 352L491 348M517 329L508 336M508 335L517 329M518 329L530 315M529 315L517 329M397 500L403 497M403 497L414 494M544 718L548 727M701 919L696 913M701 920L716 928M603 770L575 753M824 288L833 287M833 286L824 288M328 392L323 384M855 272L863 268M862 267L855 272M852 274L842 281M843 281L852 274M435 408L434 415M554 286L559 279M685 372L678 372M388 507L384 522L364 537M356 541L382 524M408 532L405 526M405 526L408 532M459 630L450 613M449 613L459 630M444 608L448 612M449 612L444 607M439 602L435 583L421 561M424 567L439 603M504 677L485 656M485 657L504 677M484 655L478 649M478 649L483 655M461 633L477 648M477 648L462 633M473 367L465 379M375 340L368 337M130 721L139 713M139 713L131 720M139 713L151 704M150 704L139 713M151 704L162 693M162 693L150 704M164 691L184 665M187 657L177 678M455 470L460 461M460 460L465 452M525 422L536 419M484 434L498 426M667 869L676 874M667 869L653 864L647 856M551 289L544 294M728 938L722 934M722 934L727 938M469 448L478 440M444 481L452 476M460 461L455 470M455 470L452 475M77 773L72 782M325 557L350 544M330 554L324 557M630 375L603 399M603 399L630 376M630 376L644 372M644 372L630 375M536 419L562 418M602 400L575 418L563 418M410 123L396 135M394 136L374 143M374 144L370 154M369 155L374 146M397 135L411 122M571 267L586 254M585 254L571 268M491 348L497 343M507 336L497 343M491 347L485 353M544 294L551 289M544 294L539 300M539 300L530 315M539 300L544 294M636 211L647 195M649 193L671 176M675 167L677 161M677 161L688 152M693 147L700 138M70 783L18 838M18 838L71 783M246 481L211 499M213 499L246 482M418 555L421 561M428 487L418 492M177 678L163 691M362 538L330 554M405 437L399 437M330 397L328 392M364 391L368 396M322 383L328 393M338 408L343 412M465 380L473 368M414 546L416 552M475 442L460 460M342 462L331 469M312 473L295 465M331 469L322 473M361 331L364 336M504 423L525 422M498 426L504 423M488 431L476 442M494 428L488 431M350 544L356 541M505 423L494 428M516 421L505 423M383 524L387 514M312 473L322 474M182 510L167 516M191 507L185 509"
  },
  "i": {
    "W": 420,
    "H": 326,
    "mer": "",
    "eau": "M34 80L44 95L49 94L52 102L59 106L66 105L69 122L77 132L77 145L73 152L89 150L92 158L89 159L105 168L109 194L113 191L118 198L119 191L124 190L122 195L124 198L131 192L140 194L146 191L148 197L156 197L160 195L163 188L169 187L172 196L184 196L198 184L210 180L213 166L229 175L241 172L241 169L229 174L209 163L212 165L209 179L198 182L193 191L185 195L173 195L169 186L163 187L157 197L148 196L146 190L140 194L131 191L124 197L124 190L119 191L117 197L114 190L108 193L109 182L106 180L105 168L92 162L89 158L92 158L90 150L87 151L74 151L78 145L77 132L70 122L66 105L59 105L51 101L49 94L44 95L40 85L34 83L34 73L38 68L35 64L40 64L39 61L43 55L39 53L49 46L47 42L51 40L49 38L55 40L59 35L57 30L54 30L55 26L45 26L49 18L47 13L50 12L39 3L42 0L37 -2L38 3L50 11L47 13L49 18L45 26L54 26L53 30L57 30L58 35L56 33L56 38L51 37L50 40L45 41L48 46L45 46L45 49L38 54L43 55L38 60L40 64L35 64L38 68L34 73L35 70L33 71L34 80ZM764 -413L756 -405L750 -404L746 -407L734 -395L726 -397L719 -392L717 -384L719 -378L709 -346L703 -345L696 -338L700 -330L686 -314L685 -303L677 -306L673 -304L665 -291L673 -281L673 -270L678 -267L673 -258L674 -256L678 -258L679 -268L674 -271L675 -281L667 -289L668 -296L676 -305L681 -301L686 -302L686 -314L693 -317L701 -329L698 -339L703 -344L710 -345L720 -377L717 -384L719 -391L727 -397L734 -395L743 -405L755 -404L761 -411L772 -413L782 -429L795 -430L782 -430L788 -474L797 -492L786 -515L776 -525L772 -542L766 -552L776 -565L769 -581L783 -588L781 -603L771 -610L777 -616L783 -642L804 -662L805 -671L812 -673L814 -684L833 -704L837 -713L850 -722L849 -734L862 -741L870 -755L881 -761L879 -769L885 -778L884 -782L869 -796L845 -802L839 -813L838 -841L825 -861L828 -873L823 -880L822 -893L817 -908L807 -944L804 -993L791 -1027L785 -1070L769 -1100L767 -1111L757 -1118L759 -1127L756 -1121L760 -1113L766 -1110L769 -1100L785 -1070L790 -1028L803 -992L807 -943L817 -902L821 -896L822 -880L827 -872L824 -861L836 -843L838 -812L844 -802L854 -800L859 -796L868 -796L884 -779L878 -770L880 -760L870 -757L861 -742L848 -734L849 -722L837 -714L825 -696L815 -687L812 -675L804 -671L805 -664L782 -641L774 -614L770 -610L780 -604L782 -588L768 -580L775 -566L765 -551L772 -541L776 -524L785 -515L796 -490L787 -474L785 -452L779 -428L771 -417L764 -413ZM157 400L161 404L157 410L160 416L167 418L186 410L193 411L202 421L212 427L219 439L222 456L191 479L185 490L192 502L200 507L204 506L210 513L213 524L206 537L209 546L219 547L211 564L198 582L206 595L228 604L240 614L245 629L244 646L258 670L262 682L284 694L306 695L315 699L323 706L325 719L345 728L356 739L373 735L381 751L381 760L388 768L389 776L412 791L419 788L422 777L427 779L432 793L433 812L447 843L448 853L455 869L473 893L484 898L499 913L503 925L522 945L525 954L548 959L558 964L573 980L578 992L589 1006L607 1016L625 1036L621 1069L624 1098L639 1112L647 1125L671 1143L690 1195L697 1199L716 1197L725 1199L741 1222L755 1230L752 1263L762 1273L774 1278L775 1301L784 1314L798 1327L815 1334L824 1361L833 1367L847 1370L860 1361L869 1360L879 1362L887 1372L889 1385L896 1397L894 1417L902 1445L900 1465L901 1469L901 1456L902 1469L908 1485L918 1500L928 1500L938 1512L959 1522L969 1536L969 1553L982 1565L981 1588L974 1623L977 1622L978 1606L983 1589L982 1577L987 1567L976 1554L969 1551L971 1540L963 1523L940 1507L929 1498L917 1498L908 1482L903 1468L903 1457L908 1440L898 1415L902 1401L897 1393L897 1383L889 1368L880 1361L868 1358L859 1359L850 1367L841 1366L823 1358L816 1333L799 1326L786 1314L776 1300L776 1278L753 1263L753 1256L756 1248L759 1249L756 1229L741 1220L738 1211L725 1198L696 1197L692 1194L685 1182L684 1169L668 1138L647 1123L640 1110L625 1097L624 1064L629 1041L626 1034L609 1015L591 1004L578 989L576 980L560 965L549 958L526 952L522 943L504 924L500 912L484 896L473 891L450 853L451 835L436 814L435 791L431 779L423 775L416 788L412 789L393 775L393 769L381 740L374 733L369 731L363 735L351 731L342 722L330 717L326 705L309 691L288 692L265 680L250 646L251 630L246 624L243 613L231 602L209 593L199 583L216 563L222 548L220 545L211 543L216 542L221 529L208 505L204 502L200 505L197 501L195 482L211 473L225 456L222 433L217 425L204 420L196 409L186 407L168 415L160 412L163 402L159 399L159 378L150 369L149 349L154 334L169 327L166 323L161 323L164 328L154 333L147 346L149 355L147 367L153 373L151 385L156 390L157 400ZM436 151L402 158L388 155L387 152L375 150L358 156L339 158L324 156L320 148L309 152L310 147L309 153L306 151L307 154L305 153L283 175L277 192L277 205L272 223L269 222L271 229L269 230L265 227L268 230L266 233L263 231L268 233L268 238L257 249L252 247L258 253L255 258L237 274L213 284L205 295L196 298L198 300L195 304L163 318L161 323L149 320L107 336L90 345L83 353L81 358L83 360L79 364L42 379L27 381L5 394L-34 398L-59 396L-72 405L-85 406L-104 414L-117 416L-129 427L-136 424L-158 442L-201 464L-225 468L-241 466L-244 470L-262 476L-288 500L-285 503L-291 502L-303 514L-318 522L-343 530L-355 530L-386 539L-420 541L-432 539L-447 542L-460 539L-461 531L-462 536L-467 539L-484 540L-498 536L-510 528L-518 528L-526 521L-537 519L-553 496L-582 469L-586 460L-592 465L-613 470L-647 502L-662 533L-677 549L-730 573L-735 572L-733 575L-750 592L-761 612L-784 635L-785 641L-778 646L-788 644L-784 647L-792 646L-790 648L-793 653L-807 666L-835 676L-852 669L-869 672L-879 670L-893 678L-927 669L-953 680L-958 688L-1004 713L-1035 757L-1058 772L-1059 794L-1068 811L-1078 854L-1081 878L-1096 903L-1093 904L-1097 908L-1093 913L-1095 920L-1115 946L-1119 943L-1121 947L-1131 947L-1170 968L-1191 970L-1194 965L-1201 968L-1208 979L-1222 985L-1229 984L-1230 978L-1235 978L-1237 980L-1236 985L-1239 980L-1241 985L-1242 981L-1248 989L-1250 989L-1247 986L-1253 984L-1261 985L-1263 990L-1271 991L-1269 987L-1280 991L-1274 986L-1274 980L-1280 980L-1281 976L-1286 978L-1284 968L-1289 973L-1290 993L-1299 994L-1320 1013L-1330 1013L-1341 1021L-1357 1022L-1356 1028L-1359 1032L-1363 1029L-1359 1022L-1376 1024L-1379 1034L-1389 1044L-1407 1053L-1450 1098L-1463 1105L-1468 1101L-1466 1103L-1472 1111L-1483 1119L-1495 1139L-1527 1175L-1560 1200L-1598 1224L-1601 1223L-1603 1232L-1616 1250L-1630 1255L-1628 1247L-1642 1260L-1640 1266L-1643 1265L-1662 1214L-1655 1208L-1637 1205L-1626 1194L-1606 1185L-1570 1179L-1550 1168L-1508 1117L-1502 1108L-1505 1107L-1502 1106L-1496 1093L-1483 1082L-1483 1078L-1452 1064L-1452 1057L-1439 1043L-1428 1020L-1413 1005L-1396 993L-1368 983L-1333 960L-1291 949L-1264 916L-1242 902L-1173 894L-1159 888L-1159 885L-1154 887L-1139 881L-1131 865L-1116 794L-1102 769L-1101 758L-1104 753L-1100 752L-1099 745L-1087 731L-1074 701L-1068 696L-1063 698L-1055 695L-1051 685L-1044 684L-1025 675L-1030 675L-1024 672L-1014 659L-1025 661L-1012 657L-1021 656L-1008 655L-977 636L-968 636L-958 631L-956 635L-956 630L-953 632L-952 629L-948 630L-946 633L-945 629L-941 629L-937 635L-940 630L-936 631L-935 628L-928 631L-927 624L-922 624L-921 626L-919 620L-914 622L-911 617L-913 622L-918 623L-903 624L-904 618L-903 620L-901 618L-902 624L-895 625L-895 621L-891 625L-891 616L-890 625L-887 624L-889 618L-886 627L-883 624L-880 641L-880 629L-876 632L-874 630L-871 635L-877 625L-868 629L-866 628L-868 623L-857 625L-860 622L-858 624L-855 619L-851 623L-851 621L-849 623L-840 620L-839 622L-840 619L-828 611L-796 569L-782 561L-772 549L-762 546L-728 518L-719 518L-709 507L-693 506L-688 492L-676 481L-675 470L-655 437L-635 425L-626 439L-629 435L-625 436L-635 425L-632 422L-608 425L-582 418L-557 429L-512 461L-487 466L-472 465L-456 456L-454 463L-447 460L-423 463L-407 460L-385 466L-381 460L-364 451L-350 450L-332 432L-323 433L-320 436L-322 433L-320 427L-304 416L-287 414L-283 409L-275 407L-248 412L-230 409L-210 391L-205 392L-195 383L-180 376L-147 371L-119 359L-76 349L-63 351L-50 344L-44 346L-34 338L-11 335L9 340L27 336L39 339L59 329L70 313L75 311L83 314L110 306L141 311L169 297L183 278L197 268L208 264L208 252L211 246L217 245L214 243L215 239L218 244L219 235L229 232L228 226L246 214L257 199L264 176L259 176L258 171L265 171L264 174L268 162L263 168L242 171L241 169L251 163L250 159L255 160L272 149L273 142L268 136L254 139L260 126L256 125L258 118L262 117L263 112L263 114L286 108L288 110L288 107L303 99L312 87L313 90L312 86L316 80L322 79L323 69L335 55L335 51L342 41L359 27L383 16L384 12L404 -5L436 -25L447 -36L446 -43L449 -38L456 -45L463 -70L469 -73L492 -104L519 -128L515 -133L521 -130L549 -151L573 -180L579 -184L577 -187L617 -212L623 -208L622 -213L628 -218L671 -240L675 -246L672 -249L674 -254L681 -251L745 -267L753 -265L779 -268L811 -309L838 -332L859 -338L924 -242L943 -192L1026 -149L1032 -141L1013 -134L987 -110L938 -78L903 -49L897 -47L890 -52L886 -50L885 -57L871 -49L872 -40L866 -40L866 -44L848 -30L846 -11L828 8L818 7L814 10L809 6L805 5L805 7L795 -13L786 -7L785 -3L775 1L763 19L749 27L734 49L711 46L710 49L710 36L701 40L694 31L687 38L678 37L673 41L648 62L644 58L643 65L632 65L618 70L596 91L592 103L583 106L576 115L549 135L542 144L533 143L513 151L508 147L484 144L472 149L458 145L456 140L453 141L456 142L456 146L436 151ZM790 -220L780 -220L777 -216L772 -217L768 -213L756 -209L740 -214L740 -218L730 -219L698 -206L687 -205L662 -189L613 -171L596 -157L570 -128L555 -104L522 -65L500 -46L459 -24L448 -8L428 12L406 23L400 35L398 31L395 33L398 37L368 65L353 96L340 110L340 118L347 124L354 125L367 115L398 118L443 113L448 115L471 101L476 104L486 105L516 96L518 100L519 97L521 99L519 96L549 73L567 46L582 34L581 26L586 29L600 25L616 14L613 10L619 12L634 5L670 -18L684 -33L695 -60L729 -107L728 -115L730 -113L734 -115L747 -127L769 -163L774 -168L777 -166L775 -168L782 -187L783 -197L792 -212L790 -220ZM783 -99L786 -98L814 -121L815 -131L807 -132L783 -99ZM291 7L291 13L302 11L305 23L312 31L317 31L320 27L325 28L330 33L331 42L337 49L330 32L323 27L312 29L302 15L303 10L300 9L305 -6L303 -17L311 -31L307 -35L297 -32L297 -27L288 -20L279 -25L284 -18L298 -26L298 -32L306 -34L310 -31L302 -17L303 -5L298 2L291 6L294 1L291 2L291 7ZM271 -53L270 -29L279 -23L271 -34L275 -63L252 -119L270 -134L267 -143L269 -154L271 -164L287 -173L269 -164L266 -144L269 -134L252 -119L254 -97L263 -88L265 -79L273 -66L271 -53ZM411 -412L398 -400L396 -384L381 -365L372 -367L363 -355L344 -345L341 -335L315 -316L313 -306L317 -300L327 -269L320 -257L320 -250L314 -244L313 -229L299 -225L294 -220L295 -225L293 -223L295 -213L289 -203L289 -191L290 -178L285 -173L291 -175L292 -193L289 -202L296 -212L296 -221L298 -224L314 -229L315 -244L320 -249L320 -257L327 -268L314 -307L316 -315L341 -334L345 -344L365 -355L373 -365L382 -365L397 -383L400 -401L411 -412ZM397 -512L377 -525L368 -526L345 -537L342 -545L325 -555L317 -564L315 -584L317 -565L325 -554L342 -544L348 -533L364 -529L370 -524L379 -524L405 -505L408 -497L423 -484L430 -469L439 -467L440 -458L425 -431L415 -424L411 -412L416 -423L432 -439L432 -444L441 -458L439 -468L430 -470L421 -489L406 -501L404 -509L397 -512ZM-432 -173L-441 -170L-446 -163L-463 -162L-471 -153L-478 -139L-494 -130L-493 -122L-498 -119L-497 -115L-514 -88L-515 -80L-523 -75L-534 -59L-532 -53L-529 -66L-523 -68L-525 -68L-523 -74L-514 -81L-513 -86L-501 -109L-492 -119L-492 -128L-487 -134L-477 -139L-470 -153L-462 -161L-446 -163L-441 -169L-419 -174L-419 -185L-410 -196L-411 -200L-404 -200L-377 -231L-380 -242L-369 -264L-360 -265L-358 -273L-344 -286L-336 -289L-325 -287L-338 -290L-349 -286L-359 -294L-352 -305L-352 -315L-345 -317L-340 -322L-334 -341L-319 -365L-335 -341L-334 -337L-339 -332L-340 -323L-353 -315L-352 -305L-359 -292L-350 -285L-354 -276L-361 -274L-360 -266L-370 -265L-374 -260L-385 -237L-382 -228L-405 -201L-411 -201L-410 -196L-419 -186L-420 -175L-432 -173ZM435 425L425 436L424 442L410 452L404 460L428 474L426 480L429 484L437 483L432 495L443 515L468 528L477 526L481 532L491 532L515 539L561 543L566 553L590 555L594 559L598 558L599 566L604 572L598 577L600 582L612 587L614 594L630 604L648 603L654 609L677 608L690 603L717 602L747 612L759 632L759 640L752 650L749 662L750 673L765 690L761 685L778 692L776 699L778 704L787 704L797 712L804 713L807 727L803 739L811 744L817 757L838 763L858 772L862 776L871 777L874 784L891 800L901 802L917 796L919 790L926 786L938 786L950 775L962 775L980 792L985 801L989 801L993 812L992 809L998 809L998 806L1011 812L1009 821L1012 820L1013 823L1017 821L1015 827L1025 829L1023 834L1026 837L1031 835L1027 840L1037 853L1033 853L1034 857L1029 861L1032 868L1024 875L1028 887L1025 900L1019 904L1023 915L1022 924L1013 930L990 976L991 990L999 994L997 1003L1002 1003L1001 998L1007 1003L1010 995L1012 1002L1014 999L1016 1003L1023 1002L1025 998L1028 1000L1028 997L1032 998L1029 994L1036 991L1031 990L1036 985L1039 986L1039 990L1055 980L1069 964L1081 958L1092 939L1106 933L1105 928L1112 925L1114 914L1120 912L1119 905L1122 904L1121 901L1127 893L1132 899L1139 896L1141 898L1149 878L1144 875L1149 863L1162 858L1168 861L1171 855L1177 855L1178 849L1176 849L1183 836L1199 835L1200 831L1215 817L1218 821L1221 817L1233 819L1247 809L1253 793L1264 790L1263 795L1264 789L1253 793L1247 809L1233 819L1221 816L1218 820L1215 817L1199 831L1199 835L1181 837L1175 849L1177 854L1170 855L1167 860L1163 861L1162 858L1149 863L1144 876L1148 878L1141 897L1132 899L1130 892L1127 893L1121 900L1122 904L1119 904L1120 911L1113 914L1111 925L1105 928L1105 933L1095 938L1092 938L1081 958L1069 964L1055 980L1039 990L1039 986L1036 985L1030 990L1036 991L1029 994L1032 998L1029 997L1028 1000L1025 998L1023 1001L1015 1002L1014 999L1011 1001L1012 997L1009 994L1007 1002L1001 997L1001 1003L997 1002L1000 994L991 989L990 976L996 969L994 965L1004 955L1013 932L1022 924L1024 915L1020 903L1026 900L1028 887L1025 875L1032 868L1030 862L1035 858L1033 853L1038 853L1027 840L1032 837L1031 835L1026 836L1023 834L1025 829L1015 826L1018 821L1013 823L1013 820L1009 820L1011 812L998 805L997 809L992 808L992 811L989 800L985 801L980 791L962 775L950 775L940 785L925 785L919 789L917 795L903 801L891 799L875 784L872 777L862 775L837 761L818 757L812 744L805 739L808 724L805 713L798 711L787 703L778 703L779 691L760 682L750 671L750 662L760 641L760 632L747 611L717 600L686 602L674 607L659 606L654 608L649 602L630 603L614 593L612 586L600 579L605 572L600 565L599 558L578 552L572 554L566 550L566 545L559 541L516 538L508 532L499 533L481 530L478 525L469 528L456 523L434 499L439 483L429 482L429 474L405 459L411 452L425 443L426 436L437 424L432 414L428 412L416 414L410 407L412 401L402 397L398 390L390 387L380 378L369 378L369 370L352 357L344 339L331 330L325 321L320 325L314 319L300 325L288 317L281 319L275 317L250 324L247 320L247 311L241 304L247 302L249 291L241 286L221 286L227 289L240 287L248 292L246 301L239 305L245 310L246 321L250 325L274 318L290 321L301 327L314 320L320 326L324 322L328 330L343 341L351 358L361 365L363 378L366 379L362 376L363 369L368 379L381 380L402 399L411 402L409 408L414 415L419 417L429 414L436 420L435 425ZM-166 67L-169 76L-166 82L-180 83L-187 89L-197 91L-200 95L-210 95L-221 106L-224 105L-243 116L-262 115L-268 113L-271 119L-279 116L-291 119L-298 115L-293 117L-295 122L-263 117L-248 119L-236 117L-231 110L-216 108L-218 107L-215 101L-209 96L-197 97L-194 91L-185 90L-180 84L-167 85L-165 82L-166 71L-160 51L-166 44L-166 33L-160 33L-155 26L-146 20L-139 5L-140 -8L-138 -18L-146 -25L-138 -53L-131 -65L-121 -65L-119 -76L-101 -69L-94 -73L-94 -79L-102 -84L-103 -93L-111 -102L-107 -125L-110 -133L-120 -136L-124 -158L-115 -160L-110 -172L-109 -192L-112 -194L-112 -191L-115 -191L-122 -201L-116 -206L-113 -228L-102 -244L-100 -261L-93 -268L-79 -268L-76 -274L-57 -272L-49 -276L-45 -273L-35 -278L-32 -299L-35 -307L-33 -318L-14 -336L-13 -334L7 -336L19 -344L35 -382L39 -387L45 -388L54 -403L54 -411L49 -421L53 -428L51 -441L63 -449L62 -462L53 -490L39 -504L39 -512L12 -554L5 -574L-17 -620L-28 -652L-21 -627L-10 -606L-1 -580L4 -575L6 -562L25 -528L32 -522L41 -498L52 -484L61 -459L62 -449L50 -441L52 -428L47 -422L52 -405L48 -401L44 -389L40 -389L34 -382L26 -368L26 -359L19 -345L7 -337L-12 -335L-16 -338L-34 -322L-37 -305L-33 -299L-37 -288L-39 -292L-36 -284L-38 -278L-57 -272L-74 -276L-80 -268L-95 -268L-106 -256L-105 -242L-113 -229L-117 -207L-123 -203L-118 -193L-109 -188L-115 -166L-125 -159L-124 -146L-120 -133L-109 -130L-108 -121L-114 -109L-113 -102L-104 -81L-96 -78L-103 -72L-120 -77L-122 -66L-131 -66L-140 -52L-148 -24L-139 -18L-142 -10L-141 6L-146 18L-156 25L-161 32L-168 29L-172 33L-167 45L-161 51L-166 67ZM-408 309L-396 322L-393 322L-390 317L-385 319L-386 337L-381 349L-385 354L-394 351L-394 355L-407 359L-409 379L-438 399L-444 411L-458 414L-449 426L-447 442L-453 448L-461 441L-456 455L-463 441L-457 440L-455 444L-450 442L-450 429L-458 418L-459 412L-445 410L-438 395L-410 378L-407 357L-396 354L-395 350L-386 352L-382 348L-388 338L-385 319L-390 318L-391 323L-396 324L-408 309ZM-392 302L-394 291L-388 286L-394 273L-390 264L-375 258L-366 244L-358 230L-361 224L-359 214L-342 201L-327 196L-319 187L-324 187L-329 195L-339 197L-357 208L-364 217L-362 234L-373 247L-374 255L-392 263L-398 275L-390 286L-395 289L-392 300L-407 306L-408 309L-392 302ZM55 547L57 535L78 526L93 526L94 521L88 520L105 519L107 513L96 515L114 508L116 502L127 502L132 496L139 498L138 491L144 489L149 478L181 464L184 450L178 438L174 437L176 426L168 418L175 426L174 437L178 438L183 450L181 463L170 470L150 476L144 488L138 490L139 497L131 496L127 502L118 501L114 507L96 513L96 516L107 514L105 519L89 518L87 521L93 521L93 525L79 525L56 535L54 548L47 554L51 562L41 575L45 597L60 600L58 606L48 616L53 618L59 631L56 634L48 636L45 643L48 652L55 657L55 663L61 665L53 680L56 685L52 688L53 692L46 695L43 701L45 707L43 712L46 715L43 724L48 725L48 735L54 739L40 752L50 767L61 772L67 770L71 772L67 773L68 775L76 777L78 788L68 792L71 798L79 800L73 808L74 817L82 820L84 828L93 829L97 834L98 847L94 856L100 862L90 867L89 886L98 892L93 895L97 902L106 905L117 926L123 925L126 930L135 931L137 939L149 934L158 936L157 942L171 945L174 950L180 953L183 950L193 957L223 953L228 957L223 953L193 957L183 950L180 952L175 950L170 944L157 942L159 937L152 934L137 939L136 931L126 930L122 925L117 925L106 904L97 903L94 897L98 892L91 888L89 875L91 866L100 862L95 856L98 847L98 834L93 828L84 828L82 819L74 816L74 808L79 800L70 796L69 791L76 791L79 784L76 776L69 775L71 772L67 769L61 772L50 767L40 752L55 740L48 736L49 725L44 724L46 716L44 701L46 695L53 693L56 686L53 680L61 666L55 662L54 654L48 651L50 645L46 643L49 636L56 635L60 631L53 618L49 616L58 607L61 600L47 596L42 583L42 574L52 563L48 553L55 547ZM-295 163L-291 161L-291 153L-304 137L-301 127L-295 120L-302 125L-306 135L-304 142L-292 155L-293 161L-297 161L-301 169L-306 171L-305 168L-324 187L-314 183L-299 171L-295 163Z",
    "riv": [{
      "n": "Rivière Montmorency",
      "d": "M388 -1234L379 -1218L375 -1191L370 -1186L371 -1178L364 -1174L360 -1153L353 -1152L354 -1145L345 -1138L344 -1134L338 -1133L332 -1114L315 -1092L305 -1067L293 -1054L279 -1029L281 -1018L277 -1015L269 -1018L267 -1009L262 -1009L253 -998L264 -985L265 -976L272 -971L289 -925L320 -876L319 -870L327 -853L338 -848L347 -830L345 -794L343 -790L351 -775L346 -746L350 -742L348 -727L352 -718L346 -695L349 -690L345 -681L345 -659L335 -641L333 -621L325 -612L314 -581L317 -564L326 -554L343 -543L346 -535L369 -525L379 -525L404 -509L405 -501L422 -486L430 -469L439 -467L440 -460L440 -455L435 -451L426 -432L416 -424L411 -412L402 -405L398 -398L397 -384L381 -365L372 -366L364 -355L344 -344L341 -334L315 -315L313 -306L327 -273L326 -266L320 -257L320 -249L315 -244L314 -230L298 -224L295 -220L295 -211L289 -202L292 -191L290 -175L269 -163L267 -145L269 -134L263 -126L252 -120L259 -94L272 -73L274 -62L270 -38L273 -27L287 -19L298 -27L297 -32L307 -34L311 -32L303 -17L304 -5L299 10L302 11L305 23L311 29L315 31L323 27L330 32L333 43L338 48M262 -90L260 -93M260 -91L253 -100L254 -108M265 -87L266 -79L273 -69"
    }, {
      "n": "Rivière du Berger",
      "d": "M123 19L123 21M129 165L131 166M126 164L129 165M125 164L126 164M124 21L128 24M130 33L131 34M128 25L129 25M123 14L122 16M128 24L128 24M130 36L130 37M130 30L130 31M129 25L132 28L130 30M128 24L128 25M122 17L123 19M130 31L130 32M123 21L124 21M135 45L143 75L131 79L121 76L114 79L110 86L102 92L97 108L98 114L109 126L106 130L109 130L117 150L115 153L125 164M131 34L130 36M122 16L122 17M127 10L123 14M133 168L133 168M131 166L131 166M131 166L131 166M131 166L133 168M139 176L134 177L138 181M128 6L127 9M127 9L127 10M128 6L128 6M128 3L128 6M128 3L128 3M128 -6L128 3M130 37L135 44M135 44L135 45M139 181L142 187L133 192M138 181L139 181M130 32L130 33M130 32L130 32M133 168L134 173L139 175M139 175L139 176"
    }, {
      "n": "Rivière Jacques-Cartier",
      "d": "M-101 -261L-103 -248M-114 -166L-119 -159M-108 -95L-103 -90L-104 -86M-230 109L-219 106M-262 116L-268 113L-272 119M38 -508L38 -504L55 -481L57 -470M-35 -293L-36 -279L-44 -274L-49 -276L-57 -272L-76 -274L-80 -268L-97 -266L-105 -257L-103 -244L-109 -234M-161 33L-167 32L-169 34L-166 45L-161 51L-167 72L-167 83L-180 83L-186 89L-197 91L-199 96L-209 96L-215 100L-222 110L-230 109L-250 118L-262 116L-298 122L-302 127L-304 138L-291 153L-293 162L-298 163L-301 170L-315 180L-327 195L-340 198L-361 214M-361 214L-363 220L-359 230L-375 257L-391 264L-395 276L-389 286L-394 291M-394 291L-392 297L-393 302L-407 306M-407 310L-395 324L-392 323L-390 318L-385 319L-387 326M59 -448L51 -442L52 -427M50 -424L48 -422L53 -404L44 -389M33 -377L32 -376M62 -449L59 -448M-14 -337L-24 -331L-34 -318L-36 -305L-32 -299L-35 -293M57 -470L60 -462M39 -388L33 -377M52 -427L50 -424M32 -376L25 -363M44 -389L39 -388M25 -363L24 -355M60 -462L62 -449M-109 -234L-116 -217L-116 -206L-122 -202L-118 -193L-109 -188L-114 -162L-117 -159L-123 -160L-124 -152L-120 -134L-110 -132L-108 -128L-112 -101L-102 -81L-96 -79L-94 -76L-96 -70L-100 -69L-119 -77L-122 -65L-130 -66L-133 -63L-147 -26L-139 -19L-141 -11L-139 4L-147 20L-157 26L-161 33M-383 343L-381 347L-384 352L-395 350L-396 355L-408 359L-407 371M-387 326L-386 340L-383 343M24 -355L13 -339L2 -337M-12 -335L-13 -336M-35 -291L-36 -283M2 -337L-12 -335M-11 -335L-13 -336M-13 -336L-14 -337M47 -493L53 -485M10 -558L38 -508M9 -559L10 -558M4 -575L9 -559M2 -577L4 -575"
    }, {
      "n": "Rivière Beaurivage",
      "d": "M372 1069L370 1054L373 1047L369 1035L375 1022L381 1015L375 1010L376 1005L355 993L345 993L339 996L318 986L309 987L310 982L299 966L290 961L291 955L285 952L283 942L272 944L267 940L264 942L266 945L255 954L240 959L236 955L227 957L223 953L193 957L183 950L180 952L175 950L170 944L157 942L158 936L149 934L137 939L136 931L127 931L123 925L116 925L106 904L98 903L94 897L98 892L90 887L88 878L91 866L100 862L94 856L98 847L97 834L92 829L84 827L83 820L74 816L73 809L79 800L70 796L68 791L78 788L76 776L69 775L71 772L67 769L61 772L50 767L40 752L54 740L54 737L48 735L48 725L43 724L46 715L43 712L44 700L56 687L53 679L61 665L55 662L53 654L48 651L46 643L48 636L59 632L53 618L49 615L59 606L60 600L47 597L43 592L42 574L52 563L47 553L55 548L56 535L81 525L93 525L93 521L88 519L105 519L107 514L96 514L114 507L118 501L127 502L131 496L139 497L138 490L144 488L150 477L181 464L184 451L178 438L174 437L176 427L169 416"
    }, {
      "n": "Rivière Boyer",
      "d": "M548 373L555 365M555 365L556 365M572 349L581 331L579 319L584 321L582 314L585 312L587 315L586 310L592 310L589 305L592 306L597 300L596 292L599 293L600 288L602 290L605 283L602 279L608 274L610 267L613 268L616 257L621 250L617 246L620 242L624 244L620 239L622 236L625 238L626 232L632 230L631 224L636 223L630 218L636 217L641 207L638 205L644 205L643 200L648 204L657 195L658 183L653 174L660 172L657 166L664 156L656 150L671 136L668 129L675 127L673 119L680 118L676 114L681 109L685 110L687 103L683 101L694 96L693 92L698 88L692 84L704 81L704 74L709 72L709 63L717 59L709 53L709 46M556 365L572 349"
    }, {
      "n": "Rivière Nelson",
      "d": "M-81 -5L-83 14L-89 29L-85 36L-88 54L-81 65L-63 71L-58 70L-50 76L-38 77L-37 82L-32 79L-17 85L-16 88L-13 86L-12 91L5 87M5 87L24 78L25 80L28 78L34 80M5 87L5 87M-45 -118L-45 -118M-77 -74L-65 -50L-57 -44L-57 -36L-53 -27L-55 -20L-60 -18M-60 -18L-60 -18M-60 -18L-67 -18M-67 -18L-67 -18M-67 -18L-72 -20L-78 -17L-81 -5M-81 -5L-81 -5M-77 -74L-77 -74M-78 -76L-77 -74"
    }, {
      "n": "Rivière Etchemin",
      "d": "M1333 682L1337 700L1332 715L1317 732L1307 739L1303 754L1286 782L1267 796L1263 796L1264 789L1253 793L1247 808L1233 819L1222 816L1218 820L1215 817L1199 832L1199 835L1183 836L1176 849L1177 854L1170 855L1168 860L1163 861L1162 858L1149 863L1144 876L1149 878L1141 898L1139 896L1132 899L1129 892L1127 894L1121 901L1122 904L1119 905L1120 911L1113 914L1111 925L1105 928L1106 933L1092 939L1081 958L1069 964L1062 974L1039 990L1039 986L1036 985L1031 990L1036 991L1029 994L1032 998L1028 997L1028 1000L1025 998L1023 1001L1015 1003L1013 999L1012 1002L1010 994L1007 1002L1002 998L1002 1003L997 1002L1000 994L991 990L990 976L1012 932L1022 924L1024 915L1019 905L1026 900L1028 888L1024 875L1032 869L1029 861L1035 857L1033 854L1038 853L1027 840L1031 835L1026 836L1023 834L1024 829L1015 827L1018 821L1013 823L1012 820L1009 821L1011 812L998 806L997 809L992 808L992 811L989 800L985 801L980 792L962 775L951 775L937 786L926 785L910 800L901 802L891 800L875 785L872 777L862 775L831 759L817 757L811 743L805 740L808 724L805 713L798 712L786 704L779 704L777 700L778 691L760 684L750 672L749 662L760 640L760 632L747 612L718 601L690 602L676 608L655 609L649 603L630 603L614 594L612 587L600 579L605 572L599 566L598 558L593 558L589 554L572 554L565 550L560 542L550 543L515 538L480 530L477 525L469 528L456 523L434 500L437 482L428 482L429 475L408 463L405 459L424 443L426 436L437 422L433 416L429 413L417 416L410 408L412 402L401 398L397 391L390 388L380 378L368 377L360 363L350 356L345 341L330 330L324 321L320 325L314 320L303 326L291 320L266 319M266 319L251 325L247 320M247 320L247 312L240 305L246 302L248 292L240 286L224 288L221 282"
    }, {
      "n": "Rivière Sainte-Anne",
      "d": "M921 -1563L929 -1550L926 -1527L932 -1525L932 -1522L920 -1520L885 -1503L883 -1493L857 -1473L834 -1473L828 -1477L821 -1476L821 -1468L816 -1458L821 -1447L816 -1437L821 -1432L821 -1416L815 -1409L816 -1403L820 -1401L821 -1391L833 -1385L828 -1381L826 -1375L829 -1366L829 -1332L835 -1300L811 -1277L805 -1252L792 -1226L793 -1208L786 -1186L792 -1175L790 -1168L756 -1122L758 -1115L767 -1110L769 -1100L785 -1070L791 -1027L803 -992L807 -944L817 -903L821 -895L822 -881L827 -875L824 -862L837 -844L839 -812L844 -803L854 -801L860 -796L868 -796L881 -786L885 -779L878 -769L880 -760L870 -756L861 -742L849 -734L850 -722L837 -713L826 -695L815 -686L812 -674L805 -671L805 -664L782 -641L777 -615L770 -610L780 -604L782 -588L769 -580L775 -565L766 -551L772 -541L776 -525L785 -515L794 -499L796 -487L787 -475L786 -451L779 -426L771 -416L759 -410L756 -404L747 -407L734 -395L727 -397L720 -392L717 -384L720 -378L710 -346L698 -340L700 -329L686 -314L685 -302L676 -305L668 -299L666 -290L674 -281L673 -270L679 -268L674 -257L680 -238M-319 -633L-311 -638L-310 -628L-300 -629L-295 -622L-289 -625L-283 -617L-282 -603L-286 -593L-279 -583L-277 -559L-285 -525L-295 -503L-303 -431L-315 -413L-310 -402L-315 -400L-316 -393L-312 -385L-320 -376L-318 -366L-335 -341L-339 -324L-345 -317L-352 -315L-352 -305L-359 -293L-350 -286L-360 -266L-370 -264L-373 -260L-380 -242L-381 -228L-405 -201L-411 -201L-410 -196L-419 -186L-420 -174L-441 -170L-446 -163L-463 -161L-471 -153L-477 -139L-487 -134L-492 -129L-492 -122L-497 -119L-496 -114L-511 -91L-514 -80L-529 -66L-533 -58L-534 -48L-550 -24L-555 -7L-560 -3L-554 5L-551 17L-560 21L-570 32"
    }, {
      "n": "Rivière Saint-Charles",
      "d": "M40 60L40 64L35 64L38 68L34 73L34 83L39 85L44 95L49 94L51 102L59 106L66 105L69 122L77 131L78 145L73 151L89 150L92 158L89 158L105 167L106 180L109 183L108 194L113 190L118 197L120 191L125 190L122 195L124 198L131 192L140 194L146 190L148 197L156 197L163 188L169 186L172 195L185 196L201 182L208 181L213 166L229 174L242 170M37 -2L39 4L45 7L47 12L50 11L47 13L49 18L45 26L54 26L54 30L57 30L59 35L55 39L51 37L50 40L45 41L49 46L39 53L43 55L40 60M242 170L268 157L287 152"
    }, {
      "n": "Rivière Chaudière",
      "d": "M215 561L220 549L219 545L210 544L214 534L211 513L195 498L193 492L194 479L210 470L222 458L223 451L220 435L216 427L205 422L194 410L187 408L166 417L159 413L157 410L162 404L157 395L157 381L149 368L148 349L154 334L166 328L161 322M756 1235L755 1230L741 1221L724 1198L692 1196L669 1141L648 1125L639 1110L626 1099L622 1068L628 1042L626 1035L606 1014L590 1005L577 990L574 979L562 967L549 958L525 953L522 944L503 924L498 911L484 897L472 892L449 853L448 843L434 813L432 790L428 778L421 776L418 787L412 790L392 775L373 733L363 738L355 736L344 725L328 718L322 703L316 697L302 692L286 693L264 682L248 645L249 629L244 624L241 613L230 604L208 595L199 582L215 561"
    }],
    "aut": "M240 185L239 173M233 107L239 103M155 349L155 357M157 355L157 345M198 343L225 330M79 -43L77 -18M81 -5L78 -39M174 133L178 140M336 48L332 54M301 99L273 112M379 11L364 21M317 79L322 79L324 66M78 -39L77 -51L65 -68M125 151L122 146M90 126L84 118M98 135L110 137M117 43L111 29M117 44L119 51M-12 96L-33 80M-65 65L-85 58M6 127L27 154M174 142L169 145M149 214L146 223M147 222L174 219M146 227L147 221M162 150L167 147M166 122L172 130M160 116L155 108M239 174L239 185M253 135L248 144M253 135L255 128M299 66L305 69M332 54L336 48M259 77L251 85M280 63L287 65M237 104L229 107M212 173L219 174M155 108L163 119M155 107L137 77M110 30L116 43M109 12L108 4M451 -52L471 -84M593 -200L586 -195M144 307L150 323M-308 707L-262 687L-220 641M133 163L127 154M198 469L183 433M186 444L193 460M395 754L403 764L412 767M338 46L345 39M493 863L496 869M63 254L55 261M119 51L135 75M681 -276L686 -280M-71 282L-41 295M134 165L142 178M146 189L145 182M145 192L145 204M80 245L91 241M77 246L69 249M155 359L161 385M95 180L106 176M197 128L203 124M204 124L210 119M217 114L211 118M64 -68L79 -43M65 -68L50 -103L47 -126M666 -261L661 -256M618 -215L612 -211M661 -255L666 -261M637 -227L648 -233M621 -217L627 -221M540 -155L515 -132M612 -211L593 -200M660 -249L659 -240M-68 518L-145 560M-67 518L-9 488M143 366L138 374M484 841L465 786L438 770M496 869L522 900M-10 488L-67 518M191 346L151 360M427 767L436 770M412 766L403 763L397 754M172 409L160 380M437 770L427 766M437 771L463 785L482 841M278 305L249 319M523 177L548 179L578 165L610 138M-220 640L-263 686L-309 706M-144 559L-68 519M-429 430L-398 427L-377 414M-372 409L-377 413M-378 413L-400 426L-429 428M-377 414L-371 410M-371 410L-352 397M-351 397L-329 385M-352 395L-371 409M-176 318L-109 297M-260 360L-300 374M515 -131L504 -116M516 -132L541 -156M1077 -107L1017 -90L845 51L797 76M797 76L865 41L892 10L1017 -89L1077 -106M767 76L756 76M713 76L704 76M704 76L713 76M716 76L731 76M-33 80L-54 70M37 276L47 268M-9 299L-23 302M96 -1L109 6L110 29M81 114L78 106M253 83L260 76M250 86L245 92M259 116L255 126M112 173L139 162M101 237L92 240M117 230L123 228M171 128L166 122M172 144L178 140M255 128L253 135M73 -380L94 -402M107 -428L112 -437L137 -444M-319 381L-263 363M278 110L305 96M161 220L147 222M161 385L166 397M129 285L136 282M121 251L124 258M106 217L111 225M135 291L134 282M132 277L129 271M148 325L140 307M140 307L147 325M109 272L100 263M379 11L402 -5M95 -403L72 -380M47 -140L49 -106L64 -68M47 -129L47 -140M95 -251L85 -272L64 -290L64 -339L69 -355M72 -377L71 -366M47 -140L62 -180M-81 282L-120 302L-177 317M-100 293L-72 282M62 -181L64 -189M62 -180L47 -140M94 -250L93 -229L71 -207L62 -181M64 -189L72 -208L93 -228L95 -250M68 251L79 245M327 62L332 54M255 127L257 118M148 206L144 201M103 176L95 180M178 140L190 159M1 295L25 282M124 258L121 250M110 222L107 217M158 152L152 156M117 239L114 233M131 225L145 222M142 177L138 171M142 161L148 158M186 135L179 139M152 156L116 171M130 275L133 282M138 376L142 368M142 368L148 363M113 277L119 283M45 167L10 133M37 164L71 180M68 -355L63 -338L63 -290L85 -271L94 -251M71 -362L72 -372M110 137L98 135M55 261L65 254M47 267L36 275M242 154L253 136M135 74L120 49M142 86L154 107M121 145L116 139M182 216L174 218M345 39L350 35M344 39L337 46M57 172L45 167M121 146L125 151M496 868L493 862M492 860L484 842M521 897L497 869M-187 607L-151 566M-151 566L-188 606M-188 607L-220 640M-219 640L-188 607M523 177L492 173L442 186L420 184M732 76L716 76M737 76L756 76M756 76L767 76M756 76L737 76M353 32L365 21M351 34L344 39M422 -19L402 -5M403 -6L423 -19M424 -20L437 -30L450 -51M450 -51L437 -30L423 -20M156 358L171 352M200 342L194 345M244 321L234 325M171 352L193 346M482 842L492 861M148 218L150 211M3 119L-8 102M89 183L94 180M89 253L98 262M94 130L98 135M242 154L239 171M273 112L266 113M586 -195L577 -188M577 -188L584 -193M156 252L160 257M183 146L179 140M503 -115L497 -109M504 -116L515 -131M152 156L159 152M175 134L171 128M165 121L160 116M122 228L114 231M793 76L779 76M784 76L794 76M138 374L129 408L83 440M66 449L124 412M181 429L175 415M174 415L180 429M294 647L273 608M273 609L294 648M261 597L270 606M271 606L261 596M259 594L253 588M253 589L258 594M251 585L244 576L241 543L210 493M216 506L238 541L242 575L250 586M417 767L426 767M426 766L417 766M394 750L384 731L352 705M351 705L382 730L393 750M348 702L336 689M335 689L348 702M299 653L333 687M334 687L300 653M325 64L308 91M93 240L102 236M137 -444L149 -445M71 -366L69 -358M186 135L191 131M89 253L80 245M114 278L109 272M166 147L161 150M108 4L92 -2M110 29L109 16M114 232L111 225M145 222L136 223M187 153L183 146M103 267L111 275M86 183L77 183L81 191M-414 829L-389 811M-389 810L-414 829M-389 811L-362 785M-363 785L-389 810M-360 782L-326 748L-315 723M-309 707L-331 752M286 292L296 272M297 270L306 253M440 187L465 180M350 214L381 195M335 227L342 221M90 241L80 245M85 191L89 183M74 183L80 190M497 -109L483 -97M497 -109L504 -115M86 195L77 186M77 185L69 178M114 233L116 239M-315 720L-313 713M317 243L335 227M260 316L279 305M279 305L285 294M295 272L285 292M285 292L279 304M148 362L143 366M254 318L260 316M-150 566L-144 559M-2 485L53 457M-9 488L-2 485M9 479L-5 486M672 83L640 105L613 136M613 136L672 83M672 83L703 76M703 76L684 76L672 83M465 180L497 174L523 177M610 138L578 164L550 177L523 177M185 -475L154 -449M151 -447L125 -443L107 -432M106 -428L97 -407M95 -404L106 -425M156 -449L182 -468L187 -477M542 -157L574 -186M573 -185L541 -156M365 21L379 11M401 -5L379 11M364 21L352 33M483 -96L497 -109M483 -97L471 -84M471 -84L450 -52M471 -84L483 -96M532 906L524 900M631 -223L637 -227M100 263L92 255M686 -280L701 -295L711 -317M713 -321L763 -358M763 -358L767 -363M768 -367L770 -376M772 -379L777 -392M777 -392L783 -402L800 -413M800 -413L808 -419M811 -423L827 -442M123 228L131 225M80 245L89 253M-178 317L-199 323L-254 357M-252 358L-198 324L-177 318M204 481L210 494M227 329L234 326M234 326L245 322M225 329L202 340M118 243L120 249M210 494L214 504M211 119L216 115M223 111L230 108M291 66L298 66M305 69L299 66M266 70L262 74M243 96L239 102M128 268L126 262M287 64L280 62M-331 752L-360 782M79 442L9 479M234 325L226 329M79 245L74 242M174 218L161 220M116 139L121 145M229 107L223 111M9 132L3 119M77 105L81 114M84 118L93 129M239 171L239 162M246 147L242 154M272 113L278 110M-9 100L4 122M209 490L204 481M27 154L37 164M167 399L172 409M308 92L324 66M193 460L199 473M182 433L186 444M144 181L145 189M342 221L348 215M329 231L307 252L296 271M308 251L316 244M308 91L304 96M36 276L11 289M160 378L158 367M-31 298L-70 282M-23 302L-31 298M151 362L156 358M10 289L-9 299M77 -16L84 -3M393 189L406 183L440 187M381 195L393 189M358 206L331 230M372 199L358 206M53 457L66 449M69 249L63 254M136 77L142 86M395 187L372 199M420 184L395 187M-10 301L1 295M125 411L135 389M136 384L138 376M29 280L36 276M-32 299L-19 304L-10 301M-40 296L-32 299M-107 297L-100 293M-259 361L-252 358M-319 380L-351 395M-300 374L-314 378M-329 385L-319 381M-254 357L-260 360M-145 560L-151 565"
  },
  "pts": {
    "limoilou": [425.2, 410.5, 219.1, 160.6],
    "montcalm": [425.6, 431.7, 219.8, 207.6],
    "saint-roch": [429.1, 419.9, 227.6, 181.5],
    "saint-sauveur": [420.5, 425.4, 208.7, 193.5],
    "sainte-foy": [385.9, 455.6, 132.0, 260.3],
    "charlesbourg": [403.8, 380.6, 171.8, 94.4],
    "beauport": [448.9, 381.8, 271.4, 97.1],
    "lebourgneuf": [386.2, 403.0, 132.8, 144.1],
    "vieux-quebec": [440.6, 421.2, 253.1, 184.3],
    "la-haute-saint-charles": [341.0, 359.6, 32.8, 48.0],
    "l-ancienne-lorette": [350.8, 427.7, 54.5, 198.7],
    "saint-augustin-de-desmaures": [292.4, 482.3],
    "boischatel": [482.9, 349.4, 346.8, 25.3],
    "lac-beauport": [387.4, 308.2],
    "stoneham-et-tewkesbury": [344.3, 260.3],
    "sainte-brigitte-de-laval": [448.1, 257.8],
    "sainte-catherine-de-la-jacques-cartier": [198.7, 394.8],
    "shannon": [257.1, 358.2],
    "levis": [457.9, 430.4, 291.5, 204.7],
    "saint-henri": [523.7, 526.8],
    "saint-lambert-de-lauzon": [436.9, 618.1],
    "saint-apollinaire": [258.7, 596.2],
    "sainte-marie": [545.2, 736.2],
    "donnacona": [130.4, 540.3],
    "pont-rouge": [149.6, 470.9],
    "saint-raymond": [68.1, 356.1],
    "la-cite-limoilou": [437.7, 400.4, 246.7, 138.1],
    "les-rivieres": [396.2, 422.9, 154.9, 188.0],
    "sainte-foysillerycap-rouge": [358.8, 470.6, 72.2, 293.5],
    "wendake": [353.8, 384.2, 61.1, 102.3],
    "lac-delage": [323.9, 285.2],
    "saint-gabriel-de-valcartier": [286.7, 317.7],
    "fossambault-sur-le-lac": [195.6, 374.1],
    "lac-saint-joseph": [170.4, 334.4],
    "sainte-petronille": [484.4, 390.0, 350.0, 115.1],
    "saint-pierre-de-l-ile-d-orleans": [523.9, 361.1],
    "saint-laurent-de-l-ile-d-orleans": [553.6, 375.5],
    "sainte-famille-de-l-ile-d-orleans": [583.2, 288.9],
    "saint-jean-de-l-ile-d-orleans": [622.8, 332.2],
    "saint-francois-de-l-ile-d-orleans": [672.2, 260.0],
    "l-ange-gardien": [507.4, 332.7],
    "chateau-richer": [552.9, 286.4],
    "sainte-anne-de-beaupre": [594.4, 246.1],
    "beaupre": [623.2, 223.8],
    "saint-joachim": [656.3, 213.3],
    "saint-ferreol-les-neiges": [652.4, 158.9],
    "saint-tite-des-caps": [699.4, 137.2],
    "neuville": [214.1, 522.1],
    "lac-sergent": [132.8, 374.1],
    "cap-sante": [106.5, 545.9],
    "saint-basile": [73.7, 471.0],
    "desjardins": [492.3, 450.6, 367.5, 249.4],
    "les-chutes-de-la-chaudiere-est": [427.0, 515.6],
    "les-chutes-de-la-chaudiere-ouest": [349.9, 541.6],
    "beaumont": [557.4, 406.9],
    "saint-charles-de-bellechasse": [593.1, 462.2],
    "saint-michel-de-bellechasse": [612.9, 375.5],
    "la-durantaye": [649.2, 402.3],
    "saint-gervais": [632.6, 505.5],
    "saint-anselme": [583.2, 577.7],
    "saint-vallier": [667.7, 352.6],
    "honfleur": [634.2, 558.2],
    "saint-raphael": [711.7, 433.3],
    "sainte-claire": [642.5, 606.6],
    "saint-lazare-de-bellechasse": [682.1, 563.3],
    "saint-neree-de-bellechasse": [731.5, 491.1],
    "saint-damien-de-buckland": [761.6, 580.9],
    "saint-malachie": [702.6, 665.5],
    "armagh": [807.7, 482.8],
    "saint-isidore": [504.1, 621.1],
    "sainte-henedine": [572.0, 643.4],
    "saint-bernard": [484.4, 693.3],
    "scott": [520.3, 688.4],
    "sainte-marguerite": [602.2, 683.3],
    "saint-elzear": [523.9, 779.9],
    "frampton": [677.7, 725.0],
    "berthier-sur-mer": [722.0, 324.4],
    "saint-francois-de-la-riviere-du-sud": [731.5, 361.1],
    "saint-pierre-de-la-riviere-du-sud": [785.0, 334.4],
    "saint-agapit": [304.3, 637.9],
    "saint-antoine-de-tilly": [217.5, 548.8],
    "saint-gilles": [346.0, 678.8],
    "saint-narcisse-de-beaurivage": [425.4, 708.2],
    "notre-dame-du-sacre-coeur-d-issoudun": [193.7, 625.0],
    "saint-patrice-de-beaurivage": [425.1, 765.5],
    "laurier-station": [188.7, 659.3],
    "saint-flavien": [207.6, 678.8],
    "dosquet": [249.4, 721.2],
    "sainte-croix": [128.5, 592.2],
    "saint-sylvestre": [431.2, 810.3]
  },
  "cadre": [326.2, 338.0, 189.8, 147.3],
  "lab": {
    "fleuve": [100.8, 589.3],
    "ile": [599.0, 327.6],
    "nord": [444.8, 52.0],
    "sud": [11.9, 814.6]
  }
};
const auMedaillon = s => (CARTE_QC.pts[s] || []).length > 2;
function Couches({
  v,
  id
}) {
  return <React.Fragment>
  <rect width={v.W} height={v.H} fill="#F4F7FB" />
  {v.mer && <path d={v.mer} fill="#BFD5EE" />}
  <path d={v.eau} fill="#BFD5EE" fillRule="evenodd" stroke="#A9C6E8" strokeWidth=".8" />
  {v.riv.map(r => <path key={r.n} d={r.d} fill="none" stroke="#9DBDE4" strokeWidth={id === 'i' ? 1.8 : 1.2} strokeLinecap="round" strokeLinejoin="round" />)}
  <path d={v.aut} fill="none" stroke="#fff" strokeWidth={id === 'i' ? 4 : 3.2} strokeLinecap="round" strokeLinejoin="round" />
  <path d={v.aut} fill="none" stroke="#E2C58F" strokeWidth={id === 'i' ? 1.6 : 1.2} strokeLinecap="round" strokeLinejoin="round" opacity=".9" /></React.Fragment>;
}
function CarteRegion({
  L,
  act,
  setSel,
  survol,
  quitte,
  aller,
  en
}) {
  const M = CARTE_QC.m,
    I = CARTE_QC.i,
    P = CARTE_QC.pts,
    B = CARTE_QC.lab,
    [cx, cy, cw, ch] = CARTE_QC.cadre,
    central = act && auMedaillon(act.s);
  const IW = 320,
    IH = Math.round(IW * I.H / I.W),
    IX = 14,
    IY = 14,
    etq = en ? 'QUÉBEC CITY AND LÉVIS' : 'QUÉBEC ET LÉVIS';
  const pt = (q, x, y, petit) => {
    const on = L.includes(q),
      a = act && act.s === q.s;
    return <g key={q.s + (petit ? 'i' : 'm')} onClick={() => on ? setSel(q.s) : aller(q.s)} onDoubleClick={() => aller(q.s)} onMouseEnter={() => on && survol(q.s)} onMouseLeave={quitte} style={{
      cursor: 'pointer'
    }}>
    {a && <circle className="sel-halo" cx={x} cy={y} r="15" fill="none" stroke="#4581CB" strokeWidth="2" />}
    <circle className="sel-pt" cx={x} cy={y} r={a ? 9 : on ? 6 : 3.5} fill={a ? '#0C2147' : on ? '#4581CB' : '#A7B9D0'} stroke="#fff" strokeWidth={on ? 2.2 : 1.4} />
    {(a || !petit && on && L.length <= 8) && <text x={x > M.W - 150 && !petit ? x - 13 : x + 13} y={y + 4} textAnchor={x > M.W - 150 && !petit ? 'end' : 'start'} fontSize={a ? 14 : 12} fontWeight={a ? 700 : 600} fill="#0C2147" style={{
        paintOrder: 'stroke'
      }} stroke="#F4F7FB" strokeWidth="4" strokeLinejoin="round">{q.n}</text>}</g>;
  };
  return <svg viewBox={'0 0 ' + M.W + ' ' + M.H} preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
    <Couches v={M} id="m" />
    <text x={B.fleuve[0]} y={B.fleuve[1]} fontSize="13" fill="#5B86BB" letterSpacing="1.5" transform={'rotate(-24 ' + B.fleuve[0] + ' ' + B.fleuve[1] + ')'}>{en ? 'St. Lawrence River' : 'Fleuve Saint-Laurent'}</text>
    <text x={B.ile[0]} y={B.ile[1]} fontSize="10.5" fill="#5B86BB" letterSpacing="1" textAnchor="middle" transform={'rotate(-34 ' + B.ile[0] + ' ' + B.ile[1] + ')'} style={{
      paintOrder: 'stroke'
    }} stroke="#F4F7FB" strokeWidth="3" strokeLinejoin="round">Île d’Orléans</text>
    <text x={B.nord[0]} y={B.nord[1]} fontSize="11" fontWeight="700" letterSpacing="2.4" fill="#4581CB">{en ? 'NORTH SHORE' : 'RIVE-NORD'}</text>
    <text x={B.sud[0]} y={B.sud[1]} fontSize="11" fontWeight="700" letterSpacing="2.4" fill="#6B7A8F">{en ? 'SOUTH SHORE' : 'RIVE-SUD'}</text>
    <rect x={cx} y={cy} width={cw} height={ch} rx="6" fill={central ? 'rgba(12,33,71,.08)' : 'rgba(69,129,203,.06)'} stroke={central ? '#0C2147' : '#4581CB'} strokeWidth="1.6" strokeDasharray="5 4" />
    <path d={'M' + cx + ' ' + cy + 'L' + IX + ' ' + (IY + IH) + 'M' + (cx + cw) + ' ' + cy + 'L' + (IX + IW) + ' ' + (IY + IH)} stroke="#4581CB" strokeWidth="1" strokeDasharray="3 4" opacity=".6" />
    {QUARTIERS.filter(q => P[q.s] && !auMedaillon(q.s)).map(q => pt(q, P[q.s][0], P[q.s][1], false))}
    <defs><filter id="cq-om" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0C2147" floodOpacity=".22" /></filter></defs>
    <g transform={'translate(' + IX + ' ' + IY + ')'}>
      <rect x="-2" y="-2" width={IW + 4} height={IH + 4} rx="12" fill="#fff" stroke="#fff" strokeWidth="3" filter="url(#cq-om)" />
      <svg x="0" y="0" width={IW} height={IH} viewBox={'0 0 ' + I.W + ' ' + I.H} style={{
        overflow: 'hidden'
      }}><Couches v={I} id="i" />
        {QUARTIERS.filter(q => auMedaillon(q.s)).map(q => pt(q, P[q.s][2], P[q.s][3], true))}</svg>
      <rect x="10" y={IH - 34} width={etq.length * 7.6 + 20} height="24" rx="7" fill="#0C2147" /><text x="20" y={IH - 18} fontSize="11" fontWeight="700" fill="#fff" letterSpacing="1">{etq}</text></g>
    <g transform={'translate(' + (M.W - 196) + ' ' + (M.H - 62) + ')'}><rect width="184" height="34" rx="9" fill="#fff" opacity=".92" /><path d="M12 17h22" stroke="#E2C58F" strokeWidth="3" strokeLinecap="round" /><text x="40" y="21" fontSize="11" fill="#3E4A59">{en ? 'Highway' : 'Autoroute'}</text><path d="M104 17h22" stroke="#9DBDE4" strokeWidth="2.4" strokeLinecap="round" /><text x="132" y="21" fontSize="11" fill="#3E4A59">{en ? 'River' : 'Rivière'}</text></g>
    <text x={M.W - 12} y={M.H - 12} textAnchor="end" fontSize="10" fill="#6B7A8F">© OpenStreetMap</text>
  </svg>;
}
const sansAccent = x => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const PAR_NOM = [...QUARTIERS].sort((a, b) => a.n.localeCompare(b.n, 'fr'));
function Selecteur() {
  const [z, setZ] = React.useState('Tous'),
    [t, setT] = React.useState(''),
    [sel, setSel] = React.useState(null),
    en = useEN();
  const f = (ZTAB.find(x => x[0] === z) || ZTAB[0])[1];
  const L = PAR_NOM.filter(q => f(q) && (!t || sansAccent(q.n + ' ' + q.arr).includes(sansAccent(t))));
  const act = sel && L.find(q => q.s === sel) || L[0],
    pro = act && pageProprio(act.s);
  const aller = s => {
    window.location.hash = "/quartiers/" + s;
  };
  /* Survol : l'aperçu change seulement quand le pointeur s'arrête sur un secteur (pas à chaque passage); le clavier, lui, change tout de suite. */
  const minuterie = React.useRef(0),
    survol = s => {
      clearTimeout(minuterie.current);
      minuterie.current = setTimeout(() => setSel(s), 160);
    },
    quitte = () => clearTimeout(minuterie.current);
  React.useEffect(() => () => clearTimeout(minuterie.current), []);
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
        <input id="sel-q" className="sel-in" type="search" autoComplete="off" placeholder="Rechercher une ville ou un quartier" value={t} onChange={e => {
          setT(e.target.value);
          setSel(null);
        }} /></div>
      <div className="sel-z" role="group" aria-label="Filtrer par zone">{ZTAB.map(([k, fz]) => <button key={k} type="button" className="sel-zb" aria-pressed={z === k} onClick={() => {
          setZ(k);
          setSel(null);
        }}>{k}<b>{QUARTIERS.filter(fz).length}</b></button>)}</div>
      <p style={{
        margin: '2px 0 0',
        fontSize: '12px',
        color: 'var(--texte-discret)'
      }}><span>{L.length}</span> <span>{L.length > 1 ? 'secteurs' : 'secteur'}</span></p>
      {L.length ? <ul className="sel-l">{L.map(q => <li key={q.s} className="sel-li"><a href={"/quartiers/" + q.s} data-actif={act && act.s === q.s ? 'true' : 'false'} onMouseEnter={() => survol(q.s)} onMouseLeave={quitte} onFocus={() => {
            quitte();
            setSel(q.s);
          }}>
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
      <CarteRegion L={L} act={act} setSel={setSel} survol={survol} quitte={quitte} aller={aller} en={en} /></div>
      {act && <div className="sel-det">
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
          <div style={{
            display: 'grid',
            gap: '8px'
          }}><a href={"/quartiers/" + act.s} className="sel-go">Voir le guide<Icon name="arrow-right" size={16} color="#fff" /></a>
            {pro ? <a href={pro[0]} className="sel-pro"><Icon name="building-2" size={15} color="var(--bleu-600)" /><span><span>Gestion immobilière</span> · <span>{pro[1]}</span></span></a> : <a href="/offre-de-service" className="sel-pro"><Icon name="building-2" size={15} color="var(--bleu-600)" />Offre de gestion</a>}</div></div>
      </div>}
    </div></div>;
}
/* Page « La grande région de Québec » : un seul endroit pour les 90 secteurs desservis (locataires et propriétaires), avec la FAQ de la région (route.faqTexte). */
function PageQuartiers({
  route
}) {
  const [anim, setAnim] = React.useState(false);
  React.useEffect(() => {
    setAnim(true);
  }, []);
  const F = route.faqTexte || [];
  return <div className={anim ? 'qx-anim' : ''}><style>{CSS_QX + CSS_QO + CSS_QA}</style>
    <PBHeros compact route={route} surtitre="La grande région de Québec" titre="Québec, Lévis et {toute la région}, secteur par secteur" lead="Lease Lane gère des immeubles locatifs dans un rayon de 50 km autour de Québec : la ville, Lévis, la rive nord, la rive sud et l’île d’Orléans. Chaque secteur a son guide : vie locale, logements, histoire et repères." stats={[[String(QUARTIERS.length), 'secteurs, chacun avec son guide'], ['50 km', 'autour de Québec'], ['2 rives', 'et l’île d’Orléans']]} />
    <Section fond="douce"><Selecteur /></Section>
    {F.length > 0 && <Section><Bloc as="section" lab="rg-faq-t" style={{
        display: 'grid',
        gap: '28px'
      }}><H2Q id="rg-faq-t">Questions fréquentes sur la région</H2Q>
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
    <AppelFinal surtitre="Un immeuble dans la région?" titre="Parlons de {votre immeuble}." texte="Décrivez-le en deux minutes : nous répondons avec une offre et un rendez-vous proposé." bouton="Obtenir une offre" to="/offre-de-service" secondaire="Logements à louer" to2="/logements-a-louer" />
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
  }}><style>{CSS_QA}</style><TitreBloc surtitre="Autres secteurs" titre="Comparer avec {un autre secteur}." action={<Fleche to="/quartiers">Toute la région</Fleche>} />
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
