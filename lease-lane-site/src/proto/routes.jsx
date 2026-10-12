/* Converti depuis ui_kits/site-public/routes.js (prototype) — ne pas réintroduire de globaux window. */
import { LL_LOCALITES_ROUTES } from '@/proto/localites-routes';
import { LL_ARTICLES } from '@/proto/articles-blogue';
const A = ['Accueil', '/'],
  PROP = ['Gestion immobilière', '/gestion-immobiliere'],
  LOC = ['Service aux locataires', '/locataires'];
const F = (lbl, path, extra) => Object.assign({
  path,
  fil: [A, LOC, [lbl, path]],
  index: false,
  schemas: ['WebPage', 'BreadcrumbList'],
  page: 'formulaire',
  liens: ['/locataires', '/faq']
}, extra);
/* FAQ propre à chaque guide de quartier (affichée sur la page et déclarée en FAQPage). */
const QF = {
  "la-haute-saint-charles": [["Quels quartiers font partie de La Haute-Saint-Charles?", "L’arrondissement compte cinq quartiers : Loretteville, Val-Bélair, Lac-Saint-Charles, Saint-Émile et Des Châtels."], ["D’où vient le nom La Haute-Saint-Charles?", "Le nom rappelle que l’arrondissement occupe la partie haute du bassin versant de la rivière Saint-Charles, là où se trouve le lac Saint-Charles."], ["Quels parcs visiter dans La Haute-Saint-Charles?", "Le parc de la Falaise et de la chute Kabir Kouba, la réserve naturelle des Marais-du-Nord, le parc linéaire de la rivière Saint-Charles et le parc naturel du mont Bélair, à Val-Bélair."]],
  "l-ancienne-lorette": [["Où se trouve L’Ancienne-Lorette?", "Dans l’agglomération de Québec, en Capitale-Nationale. La ville est entièrement entourée par la ville de Québec, entre l’arrondissement des Rivières à l’est et celui de Sainte-Foy–Sillery–Cap-Rouge."], ["D’où vient le nom L’Ancienne-Lorette?", "Le nom rappelle le sanctuaire de Lorette, en Italie. Quand les Hurons-Wendats ont quitté la mission en 1697 pour la Jeune-Lorette, l’ancien village est devenu la Vieille-Lorette, puis L’Ancienne-Lorette."], ["L’aéroport Jean-Lesage est-il à L’Ancienne-Lorette?", "L’aéroport se trouve juste à l’ouest de la ville, sur un terrain qui appartenait autrefois à la paroisse de L’Ancienne-Lorette. Ce territoire fait partie de Québec depuis la fusion de la paroisse avec Sainte-Foy en 1971."]],
  "saint-augustin-de-desmaures": [["Où se trouve Saint-Augustin-de-Desmaures?", "Sur la rive nord du Saint-Laurent, à l’ouest de Québec. La ville est voisine de l’arrondissement Sainte-Foy–Sillery–Cap-Rouge à l’est et de Neuville à l’ouest."], ["D’où vient le nom Saint-Augustin?", "Le saint patron est Augustin d’Hippone. Il aurait été choisi pour honorer Augustin de Saffray de Mézy, gouverneur de la Nouvelle-France de 1663 à 1665, ou peut-être Paul Augustin Juchereau."], ["Comment se rendre à Saint-Augustin-de-Desmaures?", "Par l’autoroute 40 ou la route 138, qui traversent la ville d’est en ouest. La route 367, aussi appelée route de Fossambault, relie la route 138 au nord du territoire."]],
  "boischatel": [["Où se trouve Boischatel?", "Sur la Côte-de-Beaupré, à l’est de Québec, sur la rive est de la rivière Montmorency. La municipalité touche à l’arrondissement de Beauport et fait face à l’île d’Orléans."], ["La chute Montmorency est-elle à Boischatel?", "En partie. La rivière Montmorency forme la limite ouest de Boischatel, et une partie du parc de la Chute-Montmorency se trouve sur son territoire."], ["D’où vient le nom Boischatel?", "Le nom rend hommage à Jean-François de Beauchatel, premier aide de camp du général Montcalm. La municipalité s’appelait Saint-Jean-de-Boischatel avant de devenir Boischatel en 1991."]],
  "lac-beauport": [["Où se trouve Lac-Beauport?", "Au nord de Québec, dans la MRC de La Jacques-Cartier. La municipalité touche aux arrondissements de Charlesbourg et de Beauport au sud, à Stoneham-et-Tewkesbury au nord et à Sainte-Brigitte-de-Laval à l’est."], ["Que faire à Lac-Beauport?", "Du ski alpin au centre Le Relais, du ski de fond, de la raquette et du vélo de montagne aux Sentiers du Moulin, du golf au Mont-Tourbillon et de la baignade à la plage publique du lac Beauport."], ["D’où vient le nom Lac-Beauport?", "La municipalité porte le nom du lac Beauport, au sud de son territoire. Elle s’appelait Saint-Dunstan-du-Lac-Beauport jusqu’en 1989."]],
  "stoneham-et-tewkesbury": [["Où se trouve Stoneham-et-Tewkesbury?", "Dans la MRC de La Jacques-Cartier, à environ 25 km au nord du centre-ville de Québec, à la porte de la réserve faunique des Laurentides. La route 175 la traverse sur plus de 30 km."], ["Comment se rendre à Stoneham depuis Québec?", "Par la route 175, aménagée en autoroute à quatre voies jusqu’à Stoneham. Le trajet prend environ 20 minutes. Le Transport collectif de La Jacques-Cartier offre aussi un service vers Québec."], ["D’où vient le nom Stoneham-et-Tewkesbury?", "Stoneham vient de Stonham Aspal, dans le Suffolk, d’où venait le pasteur Philip Toosey. Tewkesbury est une localité du Gloucestershire, lieu d’origine de Kenelm Chandler, qui avait obtenu des terres dans la région en 1764."]],
  "sainte-brigitte-de-laval": [["Où se trouve Sainte-Brigitte-de-Laval?", "Dans la MRC de La Jacques-Cartier, à une trentaine de kilomètres au nord-est de Québec, dans la vallée de la rivière Montmorency."], ["Comment se rendre à Sainte-Brigitte-de-Laval?", "Par l’avenue Sainte-Brigitte, qui traverse la ville du nord au sud et constitue le seul accès direct vers Québec. La Traverse de Laval la relie aussi à Lac-Beauport."], ["D’où vient le nom Sainte-Brigitte-de-Laval?", "Sainte Brigitte d’Irlande, patronne de la paroisse érigée en 1863, rappelle l’origine irlandaise des premiers colons. Laval renvoie à François de Montmorency-Laval, premier propriétaire de la seigneurie de Beaupré."]],
  "sainte-catherine-de-la-jacques-cartier": [["Où se trouve Sainte-Catherine-de-la-Jacques-Cartier?", "Dans la MRC de La Jacques-Cartier, à environ 20 km à l’ouest de Québec. Elle est bordée par Shannon à l’est, Fossambault-sur-le-Lac au nord, ainsi que Pont-Rouge, Saint-Augustin-de-Desmaures et Québec au sud."], ["Quels sont les attraits de Sainte-Catherine-de-la-Jacques-Cartier?", "Le chemin de la Liseuse, une piste cyclable qui longe la rivière Jacques-Cartier, la station touristique Duchesnay et le parc de glisse du Grand-Héron, avec son anneau de glace de 2,7 km en forêt."], ["D’où vient le nom Sainte-Catherine-de-la-Jacques-Cartier?", "Sainte-Catherine évoque Catherine Nau de Fossambault, mère du premier seigneur, Alexandre Peuvret. La seconde partie du nom vient de la rivière Jacques-Cartier, qui traverse la ville."]],
  "shannon": [["Où se trouve Shannon?", "À environ 25 km au nord-ouest de Québec, dans la MRC de La Jacques-Cartier, dont elle est le chef-lieu. Elle est voisine de la base des Forces canadiennes Valcartier et de Sainte-Catherine-de-la-Jacques-Cartier."], ["D’où vient le nom de Shannon?", "Le nom rappelle l’origine irlandaise d’une grande partie de sa population, arrivée au XIXe siècle."], ["Quand Shannon a-t-elle été fondée?", "La municipalité est créée le 14 décembre 1946, à partir d’une partie du territoire de Sainte-Catherine de Portneuf. Elle est devenue une ville le 20 mai 2017."]],
  "levis": [["Où se trouve Lévis?", "Sur la rive sud du fleuve Saint-Laurent, directement en face de Québec, dans la région de la Chaudière-Appalaches. La ville s’étend entre Beaumont, à l’est, et Saint-Antoine-de-Tilly, à l’ouest."], ["Comment se rendre de Lévis à Québec?", "Par le pont de Québec ou le pont Pierre-Laporte, dans l’ouest de la ville, accessibles par l’autoroute 20 et la route 132. La Société de transport de Lévis offre aussi des trajets en autobus vers l’Université Laval et la colline Parlementaire."], ["D’où vient le nom de Lévis?", "La ville porte le nom de François Gaston de Lévis, héros de la bataille de Sainte-Foy en 1760. Bien avant, en 1629, Champlain avait nommé le cap de Lévy en l’honneur d’Henri de Lévis, vice-roi de la Nouvelle-France."]],
  "saint-henri": [["Où se trouve Saint-Henri?", "Sur la Rive-Sud, dans la MRC de Bellechasse en Chaudière-Appalaches, à environ 15 km de Lévis et 30 km de Québec. La municipalité touche Lévis au nord et La Nouvelle-Beauce à l’ouest."], ["D’où vient le nom de Saint-Henri?", "Le nom honore Henri II, empereur du Saint-Empire romain germanique. La municipalité est aussi connue sous le nom de Saint-Henri-de-Lévis."], ["Comment se rendre à Saint-Henri depuis Lévis?", "Par la route du Président-Kennedy (route 173), qui part du centre de Lévis et passe par Pintendre. La route 275 arrive aussi de Saint-Jean-Chrysostome."]],
  "saint-lambert-de-lauzon": [["Où se trouve Saint-Lambert-de-Lauzon?", "Dans la MRC de La Nouvelle-Beauce, en Chaudière-Appalaches, à environ 20 km au sud de Québec. La municipalité touche Lévis au nord, ainsi que Saint-Henri et Saint-Isidore à l’est."], ["D’où vient le nom de Saint-Lambert-de-Lauzon?", "Il honore Pierre Lambert, arpenteur qui a dressé les plans de la seigneurie de Lauzon en 1828. Lauzon rappelle cette seigneurie, qui appartenait à Jean de Lauzon."], ["Quelles routes traversent Saint-Lambert-de-Lauzon?", "L’autoroute Robert-Cliche (73) la traverse du nord au sud. Les routes 171 (rue Bellevue) et 175 (rue des Érables) y passent aussi, et la rue du Pont (route 218) sert d’axe est-ouest."]],
  "saint-apollinaire": [["Où se trouve Saint-Apollinaire?", "Sur la Rive-Sud, dans la MRC de Lotbinière, en Chaudière-Appalaches. La municipalité touche Lévis à l’est et se trouve à environ 20 km des ponts de Québec."], ["Comment se rendre à Québec depuis Saint-Apollinaire?", "Par l’autoroute Jean-Lesage (20) vers l’est, puis par le pont Pierre-Laporte ou le pont de Québec. En transport en commun, l’Express vers Sainte-Foy dessert la municipalité."], ["D’où vient le nom de Saint-Apollinaire?", "La municipalité honore Apollinaire de Ravenne, évêque martyr du IIe siècle et disciple de saint Pierre. Ses habitants s’appellent les Apollinairois et les Apollinairoises."]],
  "sainte-marie": [["Où se trouve Sainte-Marie?", "En Beauce, dans la région de Chaudière-Appalaches, à environ 40 km au sud de Québec. C’est le chef-lieu de la MRC de La Nouvelle-Beauce, accessible par l’autoroute 73."], ["Pourquoi Sainte-Marie est-elle associée aux gâteaux Vachon?", "L’entreprise Vachon a été fondée à Sainte-Marie en 1922. La Maison J.-A. Vachon, un centre d’interprétation, raconte son histoire."], ["Que visiter à Sainte-Marie?", "Le Domaine Taschereau, un parc écologique aménagé sur l’ancien domaine seigneurial, avec milieux humides et site ornithologique. On peut aussi visiter la Maison J.-A. Vachon, le Musée de l’aviation et l’économusée Le Forgeron d’or."]],
  "donnacona": [["Où se trouve Donnacona?", "Dans la MRC de Portneuf, région de la Capitale-Nationale, sur la rive nord du Saint-Laurent, à l’ouest de Québec. On y accède par l’autoroute 40 ou par le Chemin du Roy."], ["D’où vient le nom Donnacona?", "Du chef iroquoien Donnacona, qui vivait au village de Stadaconé, au bord de la rivière Saint-Charles, lors du passage de Jacques Cartier en 1535. Les habitants s’appellent les Donnaconiens et les Donnaconiennes."], ["Quelle place la papetière a-t-elle eue à Donnacona?", "L’usine, ouverte en 1912, a fait naître la ville et a employé plus de 1 500 hommes à son apogée. Elle a cessé sa production en 2008 et a été démolie à partir de 2011."]],
  "pont-rouge": [["Où se trouve Pont-Rouge?", "Dans la MRC de Portneuf, région de la Capitale-Nationale, au bord de la rivière Jacques-Cartier. La ville est voisine de Donnacona au sud et de Saint-Augustin-de-Desmaures à l’est."], ["Qu’est-ce que le moulin Marcoux?", "Un ancien moulin à eau en pierre, bâti vers 1870 à 1872 au bord de la rivière Jacques-Cartier, au 1, boulevard Notre-Dame. Restauré de 1974 à 1980, il est reconnu monument historique depuis 1978."], ["D’où vient le nom Pont-Rouge?", "Il rappelle le pont Rouge, un pont gratuit construit à côté du pont Royal, aujourd’hui le pont Déry, qui était à péage. La rue Dupont, elle, honore le curé Charles-François Dupont, en poste de 1917 à 1933."]],
  "saint-raymond": [["Où se trouve Saint-Raymond?", "Au centre de la MRC de Portneuf, dans la région de la Capitale-Nationale, à 25 km au nord de Donnacona. On l’appelle parfois Saint-Raymond-de-Portneuf."], ["Que faire dans la vallée Bras-du-Nord?", "La vallée se trouve à environ 10 km au nord de la ville. On peut y faire du canot, du kayak, de la randonnée et du vélo de montagne. Une coopérative locale gère le site."], ["Pourquoi appelle-t-on Saint-Raymond la « Ville de l’automobile »?", "Le surnom vient du grand nombre de concessionnaires automobiles installés dans la ville."]],
  "limoilou": [["Quelles sont les artères principales de Limoilou?", "La 1re Avenue, qui traverse le quartier du nord au sud, et la 3e Avenue, son artère commerçante. Le boulevard Wilfrid-Hamel, le boulevard des Capucins et le chemin de la Canardière le bordent ou le traversent."], ["Limoilou est-il un quartier de locataires?", "Oui. Au recensement de 2016, 75,8 % des habitants du Vieux-Limoilou étaient locataires."], ["D’où vient le nom Limoilou?", "Il rend hommage à Jacques Cartier, sieur de Limoëlou, premier Européen à y avoir mis le pied. La municipalité de Limoilou a été créée en 1893."]],
  "montcalm": [["Où se trouve le quartier Montcalm?", "Dans la haute-ville de Québec, à l’ouest du Vieux-Québec et du quartier Saint-Jean-Baptiste, dans l’arrondissement de La Cité-Limoilou."], ["Quelles sont les artères commerçantes de Montcalm?", "L’avenue Cartier et le boulevard René-Lévesque, entre l’avenue De Salaberry et l’avenue Bourlamaque, avec de nombreux restaurants, bars et petits commerces."], ["Quels parcs se trouvent à Montcalm?", "Une bonne partie des plaines d’Abraham, le parc des Braves, le parc Jacques-Marquette, le parc des Franciscains et le parc Lucien-Borne."]],
  "saint-roch": [["D’où vient le nom Saint-Roch?", "D’une chapelle que les Récollets dédient à saint Roch en 1692, alors qu’une épidémie frappe la colonie. Le nom passe ensuite à la rue, au faubourg, à la paroisse et au quartier."], ["Quels types de logements trouve-t-on à Saint-Roch?", "Des lofts et des condos dans d’anciens bâtiments industriels, des plex construits à la fin du XIXe siècle et des immeubles à logements des années 1940."], ["Comment Saint-Roch a-t-il changé?", "Depuis la fin des années 1990, le quartier est revitalisé : démolition du Mail Saint-Roch de 2000 à 2007, rénovation des façades et reconversion d’anciennes manufactures. Le nombre de personnes qui y travaillent a augmenté de 40 % entre 1996 et 2017."]],
  "saint-sauveur": [["D’où vient le nom Saint-Sauveur?", "De Jean Le Sueur, premier prêtre séculier de la Nouvelle-France, surnommé « Monsieur de Saint-Sauveur », qui y reçoit des terres en 1653."], ["Quels parcs trouve-t-on à Saint-Sauveur?", "Le parc Victoria, le parc Durocher, le parc Dollard-des-Ormeaux, le parc Alys-Robi et le parc linéaire des rivières Saint-Charles et du Berger, entre autres."], ["Quand Saint-Sauveur a-t-il été annexé à Québec?", "En 1889, après un référendum tenu les 26 et 27 septembre, à la suite d’un incendie qui avait détruit environ 500 maisons."]],
  "sainte-foy": [["Quand Sainte-Foy est-elle devenue une ville?", "Le 10 mars 1949. Elle a été fusionnée à la ville de Québec en 2002."], ["D’où vient le nom du chemin des Quatre-Bourgeois?", "Des quatre villas bâties par des notables au XIXe siècle le long de ce chemin : Mapple Cottage, Champlain Villa, Hazel Grove Cottage et New Prospect."], ["Quels sont les grands repères de Sainte-Foy?", "Le campus de l’Université Laval, le CHUL et les centres commerciaux du boulevard Laurier, dont Place Sainte-Foy et Place Laurier."]],
  "charlesbourg": [["Pourquoi Charlesbourg est-il appelé le village en étoile?", "En 1665, l’intendant Jean Talon y trace un village autour d’un carré central, le Trait-Carré, d’où les terres des colons rayonnent en étoile. C’est le seul village de ce type au Canada."], ["Quels quartiers composent Charlesbourg?", "Six quartiers : Notre-Dame-des-Laurentides, Des Jésuites, Orsainville, Bourg-Royal, Trait-Carré et Saint-Rodrigue."], ["Quels parcs trouve-t-on à Charlesbourg?", "Le parc de la Montagne-des-Roches, le parc des Moulins, le Domaine Notre-Dame-des-Bois, le parc Henri-Casault et le parc des Verveines, entre autres."]],
  "beauport": [["Quels quartiers composent Beauport?", "Cinq quartiers : Vieux-Moulin, Vieux-Bourg, Saint-Michel, Chutes-Montmorency et Sainte-Thérèse-de-Lisieux."], ["Où se trouve la chute Montmorency?", "À l’extrémité est de Beauport, à l’embouchure de la rivière Montmorency, dans le quartier des Chutes-Montmorency."], ["Quand Beauport a-t-elle été fusionnée à Québec?", "En 2002, lors des réorganisations municipales. Elle forme aujourd’hui l’arrondissement le plus à l’est de la ville."]],
  "lebourgneuf": [["D’où vient le nom Lebourgneuf?", "Il réunit la fin de « Charlesbourg » et le début de « Neufchâtel », les deux secteurs qui encadrent le quartier. Il est utilisé depuis 1988."], ["Dans quel arrondissement se trouve Lebourgneuf?", "Dans l’arrondissement des Rivières, au nord de l’autoroute Félix-Leclerc. Le quartier officiel s’appelle Neufchâtel-Est–Lebourgneuf."], ["Quels sont les grands axes de Lebourgneuf?", "L’avenue Chauveau et les boulevards Bastien, Lebourgneuf, Pierre-Bertrand et Robert-Bourassa, ainsi que les autoroutes Laurentienne et Félix-Leclerc."]],
  "vieux-quebec": [["Depuis quand le Vieux-Québec est-il inscrit à l’UNESCO?", "Depuis le 3 décembre 1985, comme site du patrimoine mondial."], ["Quelle est la différence entre la Haute-Ville et la Basse-Ville?", "La Haute-Ville, sur le cap Diamant, a une vocation militaire et administrative depuis 1620; la Basse-Ville, au pied du cap, s’est peuplée de commerçants et d’artisans."], ["Peut-on faire des travaux dans un logement du Vieux-Québec?", "Oui, mais les travaux sur les bâtiments sont encadrés, car le Vieux-Québec est un site patrimonial protégé par la Loi sur le patrimoine culturel."]]
};
const HORS = ["l-ancienne-lorette", "saint-augustin-de-desmaures", "boischatel", "lac-beauport", "stoneham-et-tewkesbury", "sainte-brigitte-de-laval", "sainte-catherine-de-la-jacques-cartier", "shannon", "levis", "saint-henri", "saint-lambert-de-lauzon", "saint-apollinaire", "sainte-marie", "donnacona", "pont-rouge", "saint-raymond"];
const QW = {
  "la-haute-saint-charles": "https://fr.wikipedia.org/wiki/La_Haute-Saint-Charles",
  "l-ancienne-lorette": "https://fr.wikipedia.org/wiki/L%27Ancienne-Lorette",
  "saint-augustin-de-desmaures": "https://fr.wikipedia.org/wiki/Saint-Augustin-de-Desmaures",
  "boischatel": "https://fr.wikipedia.org/wiki/Boischatel",
  "lac-beauport": "https://fr.wikipedia.org/wiki/Lac-Beauport",
  "stoneham-et-tewkesbury": "https://fr.wikipedia.org/wiki/Stoneham-et-Tewkesbury",
  "sainte-brigitte-de-laval": "https://fr.wikipedia.org/wiki/Sainte-Brigitte-de-Laval",
  "sainte-catherine-de-la-jacques-cartier": "https://fr.wikipedia.org/wiki/Sainte-Catherine-de-la-Jacques-Cartier",
  "shannon": "https://fr.wikipedia.org/wiki/Shannon_(Qu%C3%A9bec)",
  "levis": "https://fr.wikipedia.org/wiki/Lévis",
  "saint-henri": "https://fr.wikipedia.org/wiki/Saint-Henri_(Québec)",
  "saint-lambert-de-lauzon": "https://fr.wikipedia.org/wiki/Saint-Lambert-de-Lauzon",
  "saint-apollinaire": "https://fr.wikipedia.org/wiki/Saint-Apollinaire_(Québec)",
  "sainte-marie": "https://fr.wikipedia.org/wiki/Sainte-Marie_(Québec)",
  "donnacona": "https://fr.wikipedia.org/wiki/Donnacona_(Québec)",
  "pont-rouge": "https://fr.wikipedia.org/wiki/Pont-Rouge",
  "saint-raymond": "https://fr.wikipedia.org/wiki/Saint-Raymond",
  "limoilou": "https://fr.wikipedia.org/wiki/Vieux-Limoilou",
  "montcalm": "https://fr.wikipedia.org/wiki/Montcalm_(quartier)",
  "saint-roch": "https://fr.wikipedia.org/wiki/Saint-Roch_(Québec)",
  "saint-sauveur": "https://fr.wikipedia.org/wiki/Saint-Sauveur_(quartier)",
  "sainte-foy": "https://fr.wikipedia.org/wiki/Sainte-Foy_(Québec)",
  "charlesbourg": "https://fr.wikipedia.org/wiki/Charlesbourg",
  "beauport": "https://fr.wikipedia.org/wiki/Beauport",
  "lebourgneuf": "https://fr.wikipedia.org/wiki/Neufchâtel-Est–Lebourgneuf",
  "vieux-quebec": "https://fr.wikipedia.org/wiki/Vieux-Québec"
};
const Q = [['limoilou', 'Limoilou', 'à Limoilou'], ['montcalm', 'Montcalm', 'à Montcalm'], ['saint-roch', 'Saint-Roch', 'à Saint-Roch'], ['saint-sauveur', 'Saint-Sauveur', 'à Saint-Sauveur'], ['sainte-foy', 'Sainte-Foy', 'à Sainte-Foy'], ['charlesbourg', 'Charlesbourg', 'à Charlesbourg'], ['beauport', 'Beauport', 'à Beauport'], ['lebourgneuf', 'Lebourgneuf', 'à Lebourgneuf'], ['vieux-quebec', 'Vieux-Québec', 'dans le Vieux-Québec'], ['la-haute-saint-charles', 'La Haute-Saint-Charles', 'dans La Haute-Saint-Charles'], ['l-ancienne-lorette', 'L’Ancienne-Lorette', 'à L’Ancienne-Lorette'], ['saint-augustin-de-desmaures', 'Saint-Augustin-de-Desmaures', 'à Saint-Augustin-de-Desmaures'], ['boischatel', 'Boischatel', 'à Boischatel'], ['lac-beauport', 'Lac-Beauport', 'à Lac-Beauport'], ['stoneham-et-tewkesbury', 'Stoneham-et-Tewkesbury', 'à Stoneham-et-Tewkesbury'], ['sainte-brigitte-de-laval', 'Sainte-Brigitte-de-Laval', 'à Sainte-Brigitte-de-Laval'], ['sainte-catherine-de-la-jacques-cartier', 'Sainte-Catherine-de-la-Jacques-Cartier', 'à Sainte-Catherine-de-la-Jacques-Cartier'], ['shannon', 'Shannon', 'à Shannon'], ['levis', 'Lévis', 'à Lévis'], ['saint-henri', 'Saint-Henri', 'à Saint-Henri'], ['saint-lambert-de-lauzon', 'Saint-Lambert-de-Lauzon', 'à Saint-Lambert-de-Lauzon'], ['saint-apollinaire', 'Saint-Apollinaire', 'à Saint-Apollinaire'], ['sainte-marie', 'Sainte-Marie', 'à Sainte-Marie'], ['donnacona', 'Donnacona', 'à Donnacona'], ['pont-rouge', 'Pont-Rouge', 'à Pont-Rouge'], ['saint-raymond', 'Saint-Raymond', 'à Saint-Raymond']];
let LL_ROUTES = [{
  path: '/',
  page: 'accueil',
  requete: 'gestion immobilière Québec',
  titre: 'Gestion immobilière Québec et Lévis | Lease Lane',
  description: 'Lease Lane gère vos logements à Québec : location rapide, loyers encaissés, entretien suivi et chiffres visibles. Cléo répond 24/7.',
  fil: [A],
  schemas: ['WebSite', 'RealEstateAgent', 'FAQPage', 'BreadcrumbList'],
  faq: ['p1', 'p4', 'p5', 'p13', 't1'],
  liens: ['/gestion-immobiliere', '/changer-de-gestionnaire', '/offre-de-service', '/cleo', '/faq']
}, {
  path: '/gestion-immobiliere',
  page: 'gestion',
  requete: 'compagnie de gestion immobilière Québec',
  titre: 'Compagnie de gestion immobilière Québec | Lease Lane',
  description: 'Gestion d\u2019immeubles locatifs à Québec : location, perception des loyers, entretien et rapports en ligne. Vous gardez les décisions importantes.',
  fil: [A, PROP],
  schemas: ['WebPage', 'Service', 'FAQPage', 'BreadcrumbList'],
  faq: ['p6', 'p8', 'p9', 'p10', 'p11', 'p12'],
  liens: ['/gestion-immobiliere/location', '/expertise-et-strategie', '/changer-de-gestionnaire', '/cleo', '/offre-de-service']
}, {
  path: '/gestion-immobiliere/location',
  page: 'location',
  requete: 'trouver des locataires rapidement',
  titre: 'Trouver des locataires rapidement | Lease Lane',
  description: 'Mise en marché, visites réservées par Cléo 24/7 et sélection conforme à la Loi 25. Calculez ce que vous coûte un logement vacant.',
  fil: [A, PROP, ['Location et mise en marché', '/gestion-immobiliere/location']],
  schemas: ['WebPage', 'Service', 'FAQPage', 'BreadcrumbList'],
  faq: ['p5', 'p7'],
  liens: ['/gestion-immobiliere', '/cleo', '/expertise-et-strategie', '/offre-de-service']
}, {
  path: '/gestion-immobiliere/levis',
  page: 'levis',
  requete: 'gestion immobilière Lévis',
  titre: 'Gestion immobilière à Lévis | Lease Lane',
  description: 'Gestionnaire immobilier basé à Lévis : location, loyers, entretien 24/7 et suivi au TAL pour vos immeubles de Desjardins et des Chutes-de-la-Chaudière.',
  fil: [A, PROP, ['Lévis', '/gestion-immobiliere/levis']],
  schemas: ['WebPage', 'Service', 'BreadcrumbList', 'FAQPage'],
  faqLocale: 'levis',
  liens: ['/gestion-immobiliere', '/offre-de-service', '/changer-de-gestionnaire']
}, {
  path: '/expertise-et-strategie',
  page: 'expertise',
  requete: 'stratégie immobilière immeuble locatif',
  titre: 'Stratégie immobilière pour immeuble locatif | Lease Lane',
  description: 'Loyers, occupation, entretien planifié et conformité : nous analysons votre immeuble, proposons un plan écrit et mesurons les résultats chaque mois.',
  fil: [A, PROP, ['Expertise et stratégie', '/expertise-et-strategie']],
  schemas: ['WebPage', 'Service', 'FAQPage', 'BreadcrumbList'],
  faq: ['p15', 'p14', 'p16', 'p10'],
  liens: ['/gestion-immobiliere', '/changer-de-gestionnaire', '/offre-de-service', '/faq']
}, {
  path: '/changer-de-gestionnaire',
  page: 'changer',
  requete: 'changer de gestionnaire immobilier',
  titre: 'Changer de gestionnaire immobilier sans risque | Lease Lane',
  description: 'Quitter votre gestionnaire actuel en quatre étapes : lecture du contrat, transfert des baux et dossiers, avis aux locataires, premier rapport.',
  fil: [A, PROP, ['Changer de gestionnaire', '/changer-de-gestionnaire']],
  schemas: ['WebPage', 'HowTo', 'FAQPage', 'BreadcrumbList'],
  faq: ['p4', 'p3', 'p11'],
  liens: ['/gestion-immobiliere', '/expertise-et-strategie', '/offre-de-service']
}, {
  path: '/cleo',
  page: 'cleo',
  requete: 'agent conversationnel gestion immobilière',
  titre: 'Agent conversationnel en gestion immobilière | Lease Lane',
  description: 'Cléo, l\u2019agent IA de Lease Lane, explique 24/7 le droit du logement et le TAL (ex-Régie du logement), trie les urgences et réserve les visites.',
  fil: [A, ['Cléo', '/cleo']],
  schemas: ['WebPage', 'FAQPage', 'BreadcrumbList'],
  faq: ['p6', 'l3', 't1'],
  liens: ['/gestion-immobiliere/location', '/locataires', '/confidentialite', '/offre-de-service']
}, {
  path: '/logements-a-louer',
  index: false,
  page: 'logements',
  requete: 'appartement à louer Québec',
  titre: 'Appartements à louer à Québec : bientôt disponibles | Lease Lane',
  description: 'Les appartements à louer gérés par Lease Lane à Québec seront bientôt affichés ici. Cléo peut vous avertir dès leur mise en ligne.',
  fil: [A, ['Logements à louer', '/logements-a-louer']],
  schemas: ['WebPage', 'BreadcrumbList'],
  faq: ['l1', 'l2'],
  liens: ['/locataires', '/cleo', '/quartiers']
}, {
  path: '/logements-a-louer/4-et-demi-renove-montcalm',
  index: false,
  image: 'https://leaselane.ca/images/logements/montcalm-cartier.jpg',
  imageAlt: '4 ½ rénové à louer sur l\u2019avenue Cartier, Montcalm',
  page: 'fiche',
  index: false,
  requete: '4 ½ à louer Montcalm',
  titre: 'Logements à louer : bientôt disponibles | Lease Lane',
  description: 'Les logements à louer gérés par Lease Lane seront bientôt affichés sur le site. Cléo peut vous avertir dès leur mise en ligne.',
  fil: [A, ['Logements à louer', '/logements-a-louer'], ['4 ½ rénové, Montcalm', '/logements-a-louer/4-et-demi-renove-montcalm']],
  schemas: ['RealEstateListing', 'BreadcrumbList'],
  liens: ['/quartiers/montcalm', '/cleo']
}, {
  path: '/locataires',
  page: 'locataires',
  requete: 'service aux locataires',
  titre: 'Service aux locataires 24/7 | Lease Lane',
  description: 'Urgence 24/7, demande de location, administration et plaintes; travaux, suivi, loyer et bail dans le portail locataire. Cléo répond en tout temps.',
  fil: [A, LOC],
  schemas: ['WebPage', 'FAQPage', 'BreadcrumbList'],
  faq: ['l5', 'l4', 'l6', 'l7', 'l8', 'l9', 'l10', 'l1'],
  liens: ['/locataires/commentaire-ou-plainte', '/faq']
}, F('Demande de location', '/locataires/demande-de-location', {
  form: 'location',
  titre: 'Demande de location : bientôt disponible | Lease Lane',
  requete: 'demande de location logement',
  description: 'La demande de location en ligne sera bientôt offerte ici. Cléo peut vous avertir dès son ouverture.'
}), F('Commentaire ou plainte', '/locataires/commentaire-ou-plainte', {
  form: 'plainte',
  titre: 'Commentaire ou plainte | Lease Lane',
  requete: 'plainte gestionnaire immobilier',
  description: 'Commentaire, plainte ou demande administrative : accusé de réception immédiat et réponse dans le délai publié.'
}), {
  path: '/faq',
  page: 'faq',
  requete: 'FAQ gestion immobilière',
  titre: 'FAQ gestion immobilière et location | Lease Lane',
  description: 'Réponses directes aux questions des propriétaires et des locataires : offre, contrat, transition, location, travaux, loyer et bail.',
  fil: [A, ['FAQ', '/faq']],
  schemas: ['WebPage', 'FAQPage', 'BreadcrumbList'],
  faq: 'tout',
  liens: ['/expertise-et-strategie', '/locataires', '/cleo', '/offre-de-service']
}, {
  path: '/blogue',
  page: 'blogue',
  requete: 'blogue gestion immobilière Québec',
  titre: 'Blogue gestion immobilière Québec | Lease Lane',
  description: 'Droit du logement, gestion d’immeubles et nouvelles de Lease Lane : des articles rédigés par notre équipe, datés et appuyés sur leurs sources.',
  fil: [A, ['Blogue & nouvelles', '/blogue']],
  schemas: ['Blog', 'BreadcrumbList'],
  liens: ['/faq', '/cleo', '/gestion-immobiliere', '/offre-de-service']
}, {
  path: '/blogue/hausse-de-loyer-2026',
  page: 'article',
  requete: 'hausse de loyer 2026 Québec TAL',
  titre: 'Hausse de loyer 2026 au Québec : délais et TAL | Lease Lane',
  description: 'Les délais d’avis, le calcul du TAL et les options du locataire et du propriétaire, avec les articles du Code civil cités et les sources officielles.',
  fil: [A, ['Blogue & nouvelles', '/blogue'], ['Hausse de loyer 2026', '/blogue/hausse-de-loyer-2026']],
  schemas: ['Article', 'BreadcrumbList', 'FAQPage'],
  liens: ['/blogue', '/cleo', '/faq', '/offre-de-service'],
  faqTexte: [['Le propriétaire peut-il augmenter le loyer en cours de bail?', 'Non, sauf si le bail le prévoit expressément pour un bail de plus de 12 mois. La modification prend effet au renouvellement.'], ['Que se passe-t-il si le locataire ne répond pas à l’avis?', 'Son silence vaut acceptation de la hausse : le bail est reconduit aux nouvelles conditions.'], ['Le taux du TAL est-il obligatoire?', 'Non. Il sert de référence au calcul; les parties peuvent s’entendre sur un autre montant. En cas de désaccord, le TAL fixe le loyer.']],
  image: 'https://leaselane.ca/assets/img/blogue/hausse-de-loyer-2026-og.jpg',
  imageAlt: 'Bail, stylo et calculatrice sur une table, devant des maisons en rangée de Québec en hiver',
  imageAltEn: 'Lease, pen and calculator on a table, in front of Québec City row houses in winter',
  date: '2026-01-20',
  maj: '2026-10-08'
}, {
  path: '/a-propos',
  page: 'apropos',
  requete: 'Lease Lane gestion locative',
  titre: 'À propos de Lease Lane, gestion locative Québec',
  description: 'Lease Lane réunit une équipe de gestion et Cléo, un agent IA 24/7 formé au droit du logement, pour des logements loués plus vite et une gestion que vous voyez.',
  fil: [A, ['À propos', '/a-propos']],
  schemas: ['AboutPage', 'RealEstateAgent', 'BreadcrumbList'],
  liens: ['/cleo', '/gestion-immobiliere', '/offre-de-service']
}, {
  path: '/nous-joindre',
  page: 'contact',
  requete: 'joindre Lease Lane',
  titre: 'Joindre Lease Lane | Gestion immobilière, Québec et Lévis',
  description: 'Téléphone, courriel, bureau à Lévis ou Cléo 24/7 : propriétaire ou locataire, choisissez comment joindre Lease Lane.',
  fil: [A, ['Nous joindre', '/nous-joindre']],
  schemas: ['ContactPage', 'BreadcrumbList'],
  liens: ['/offre-de-service', '/cleo', '/faq']
}, {
  path: '/offre-de-service',
  page: 'offre',
  requete: 'offre de gestion immobilière',
  titre: 'Obtenir une offre de gestion immobilière | Lease Lane',
  description: 'Décrivez votre immeuble en deux minutes : type, nombre de portes, secteur. Nous répondons avec une offre et un rendez-vous proposé.',
  fil: [A, ['Offre de service', '/offre-de-service']],
  schemas: ['WebPage', 'BreadcrumbList'],
  liens: ['/expertise-et-strategie', '/changer-de-gestionnaire', '/confidentialite']
}, {
  path: '/quartiers',
  page: 'quartiers',
  requete: 'quartiers de Québec où louer',
  titre: 'Quartiers de Québec : guides pour locataires | Lease Lane',
  description: '26 guides de quartier et de ville dans la grande région de Québec : vie locale, histoire, repères et questions fréquentes. Logements à louer bientôt disponibles.',
  fil: [A, ['Guides de quartier', '/quartiers']],
  schemas: ['WebPage', 'ItemList', 'BreadcrumbList'],
  liens: ['/cleo']
}, ...Q.map(([s, n, dans]) => ({
  path: '/quartiers/' + s,
  page: 'quartier',
  requete: 'appartement à louer ' + n,
  titre: (t => t.length > 60 ? t.replace(' | Lease Lane', '') : t)('Appartement à louer ' + dans + (s === 'vieux-quebec' || HORS.includes(s) || dans.length > 24 ? '' : ', Québec') + ' | Lease Lane'),
  description: (d => d.length > 160 ? d.replace(', logements bientôt en ligne', '') : d)('Appartement à louer ' + dans + (s === 'vieux-quebec' ? '' : HORS.includes(s) ? ', près de Québec' : ', à Québec') + ' : vie locale, logements, histoire et repères. Guide Lease Lane, logements bientôt en ligne.'),
  fil: [A, ['Guides de quartier', '/quartiers'], [n, '/quartiers/' + s]],
  schemas: ['WebPage', 'FAQPage', 'BreadcrumbList'],
  wiki: QW[s],
  faqTexte: QF[s].concat([['Comment trouver un appartement à louer ' + dans + '?', 'Les logements à louer gérés par Lease Lane ' + dans + ' seront bientôt affichés sur le site, tout comme la demande de location en ligne. D’ici là, Cléo peut vous avertir dès qu’un logement est publié.']]),
  liens: ['/quartiers', '/cleo']
})), {
  path: '/glossaire-bail-residentiel',
  page: 'glossaire',
  index: false,
  requete: 'glossaire bail résidentiel Québec',
  titre: 'Glossaire du bail résidentiel au Québec | Lease Lane',
  description: 'Régie du logement, hausse de loyer, cession, dépôt de garantie : les mots courants et le terme du Code civil ou du TAL, avec la source sur le site.',
  fil: [A, ['FAQ', '/faq'], ['Glossaire du bail résidentiel', '/glossaire-bail-residentiel']],
  schemas: ['WebPage', 'BreadcrumbList'],
  liens: ['/faq', '/cleo', '/locataires', '/offre-de-service']
}, {
  path: '/temoins',
  page: 'legal',
  requete: 'témoins de navigation',
  titre: 'Témoins de navigation | Lease Lane',
  description: 'Les témoins utilisés sur leaselane.ca, leurs fins, leur durée et la façon de modifier vos choix en tout temps.',
  fil: [A, ['Témoins de navigation', '/temoins']],
  schemas: ['WebPage', 'BreadcrumbList'],
  liens: ['/confidentialite', '/conditions-utilisation', '/nous-joindre']
}, {
  path: '/conditions-utilisation',
  page: 'legal',
  requete: 'conditions d\u2019utilisation',
  titre: 'Conditions d\u2019utilisation | Lease Lane',
  description: 'Les conditions qui encadrent l\u2019utilisation du site leaselane.ca, de Cléo, des annonces de logements et des formulaires en ligne.',
  fil: [A, ['Conditions d\u2019utilisation', '/conditions-utilisation']],
  schemas: ['WebPage', 'BreadcrumbList'],
  liens: ['/confidentialite', '/temoins', '/nous-joindre']
}, {
  path: '/confidentialite',
  page: 'legal',
  requete: 'politique de confidentialité',
  titre: 'Politique de confidentialité | Lease Lane',
  description: 'Comment Lease Lane recueille, utilise, conserve et protège vos renseignements personnels, conformément à la Loi 25.',
  fil: [A, ['Politique de confidentialité', '/confidentialite']],
  schemas: ['WebPage', 'BreadcrumbList'],
  liens: ['/temoins', '/conditions-utilisation', '/gouvernance', '/nous-joindre']
}, {
  path: '/gouvernance',
  page: 'legal',
  index: true,
  requete: 'gouvernance renseignements personnels',
  titre: 'Gouvernance des renseignements personnels | Lease Lane',
  description: 'Notre responsable de la protection des renseignements personnels, les rôles, le cycle de vie des renseignements, les incidents et les plaintes (Loi 25).',
  fil: [A, ['Gouvernance des renseignements personnels', '/gouvernance']],
  schemas: ['WebPage', 'BreadcrumbList'],
  liens: ['/confidentialite', '/temoins', '/nous-joindre']
}];
/* Pages locales de la grande région de Québec (localites-routes.js, généré) : page centrale et une page par municipalité retenue. */
LL_LOCALITES_ROUTES.forEach(function (x) {
  LL_ROUTES.push({
    path: x.path,
    page: x.page,
    requete: x.requete,
    titre: x.titre,
    description: x.description,
    fil: x.page === 'region' ? [A, PROP, [x.fil, x.path]] : [A, PROP, ['Grande région de Québec', '/gestion-immobiliere/grande-region-de-quebec'], [x.fil, x.path]],
    schemas: ['WebPage', 'Service', 'BreadcrumbList', 'FAQPage'],
    faqLocale: x.slug,
    liens: ['/gestion-immobiliere', '/offre-de-service', '/gestion-immobiliere/grande-region-de-quebec']
  });
});
/* Articles du blogue (articles-blogue.js) : une adresse par article, avec leur FAQ dans les données structurées. */
LL_ARTICLES.forEach(function (x) {
  var f = x.fr;
  LL_ROUTES.push({
    path: '/blogue/' + x.slug,
    page: 'article',
    requete: f.requete,
    titre: f.titre,
    description: f.description,
    fil: [A, ['Blogue & nouvelles', '/blogue'], [f.fil, '/blogue/' + x.slug]],
    schemas: ['Article', 'BreadcrumbList', 'FAQPage'],
    liens: ['/blogue', '/cleo', '/faq', '/offre-de-service', '/gestion-immobiliere'],
    date: x.d,
    maj: x.m,
    article: x.slug,
    image: 'https://leaselane.ca/assets/img/blogue/' + x.slug + '-og.jpg',
    imageAlt: x.couv && x.couv.fr,
    imageAltEn: x.couv && x.couv.en
  });
});
/* Services réservés au portail locataire : le menu et le pied y mènent; ces anciennes adresses y redirigent. [adresse, service, écran du portail] */

let LL_ALIAS = {
  accueil: '/',
  recherche: '/logements-a-louer',
  fiche: '/logements-a-louer/4-et-demi-renove-montcalm',
  proprietaires: '/gestion-immobiliere',
  apropos: '/a-propos',
  contact: '/nous-joindre'
};
let LL_SITE = {
  domaine: 'https://leaselane.ca',
  nom: 'Lease Lane',
  raison: 'Solutions locatives LeaseLane inc.',
  slogan: 'Solutions locatives intelligentes',
  telephone: '418-473-3208',
  courriel: 'info@leaselane.ca',
  neq: '1182479981',
  adresse: null,
  /* Aucune adresse publiée pour l'instant (décision du 11 oct. 2026); nouvelle adresse officielle à venir. Ancien bureau : 1516, rue du Layon, Lévis (Québec) G7A 0E6. */urgence: '418-473-3208',
  /* Réseaux sociaux officiels (11 oct. 2026) : seulement ces trois. */
  reseaux: ['https://www.linkedin.com/company/leaselane', 'https://www.instagram.com/leaselane.ca', 'https://www.facebook.com/leaselane.ca'],
  /* Heures pour les données structurées (mêmes que « heures »). */
  heuresSpec: {
    jours: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    ouvre: '08:00',
    ferme: '17:00'
  },
  /* Heures d'ouverture (décision du 8 oct. 2026). */
  heures: 'Du lundi au vendredi, de 8 h à 17 h. Urgences 24/7. Rencontres sur rendez-vous seulement.',
  /* Délais publiés (décision du 8 oct. 2026) : urgences 24/7, première réponse aux demandes en moins de 24 h. */
  delai: 'première réponse en moins de 24 h',
  /* Responsable de la protection des renseignements personnels (Loi 25, art. 3.1) : le président, sans délégation (décision du 8 oct. 2026).
     Le site publie le titre et le courriel dédié, sans nom. */
  responsable: {
    nom: null,
    titre: 'Président',
    courriel: 'confidentialite@leaselane.ca'
  },
  /* Durée de validité du choix de témoins, en mois (S7). null : pas d'échéance tant que la valeur n'est pas fournie. version : version active de la politique des témoins. */
  temoins: {
    validiteMois: 12,
    version: '1.0'
  },
  /* Prototype : page de connexion. En production : connexion du portail locataire [adresse à confirmer]. */
  portail: "/connexion"
};
let LL_TEL_URGENCE = () => 'tel:' + String(LL_SITE.urgence || '').replace(/[^\d+]/g, '');
let LL_CARTE = {
  tuiles: '[URL des tuiles approuvées]',
  attribution: '[attribution de la source]',
  fournisseur: '[fournisseur]'
};
export { LL_ROUTES, LL_ALIAS, LL_SITE, LL_TEL_URGENCE, LL_CARTE };
