import Controller from 'pedigree/controller';
import SaveLoadEngine from 'pedigree/saveLoadEngine';
import View from 'pedigree/view';
import DynamicPositionedGraph from 'pedigree/model/dynamicGraph';
import Helpers from 'pedigree/model/helpers';
import Workspace from 'pedigree/view/workspace';
import DisorderLegend from 'pedigree/view/disorderLegend';
import HPOLegend from 'pedigree/view/hpoLegend';
import GeneLegend from 'pedigree/view/geneLegend';
import ExportSelector from 'pedigree/view/exportSelector';
import ImportSelector from 'pedigree/view/importSelector';
import NodeMenu from 'pedigree/view/nodeMenu';
import NodetypeSelectionBubble from 'pedigree/view/nodetypeSelectionBubble';
import TemplateSelector from 'pedigree/view/templateSelector';
import ActionStack from 'pedigree/undoRedo';
import VersionUpdater from 'pedigree/versionUpdater';
import PedigreeEditorParameters from 'pedigree/pedigreeEditorParameters';
import DefaultFhirTerminologyHelper from 'pedigree/DefaultFhirTerminologyHelper';

import '../style/editor.css';

/**
 * The main class of the Pedigree Editor, responsible for initializing all the basic elements of the app.
 * Contains wrapper methods for the most commonly used functions.
 * This class should be initialized only once.
 *
 * @class PedigreeEditor
 * @constructor
 */

var PedigreeEditor = Class.create({
  initialize: function(options) {
    options = options || {};

    // front end configurations
    var returnUrl = options.returnUrl || 'https://github.com/phenotips/open-pedigree';
    
    // URL to load patient data from and save data to
    var patientDataUrl = options.patientDataUrl || '';
    var backend = options.backend || {};
    var enableAutosave = options.autosave || false;

    if (backend.save === undefined || typeof backend.save !== 'function') {
      console.error('No "save" function provided for backend');
    }
    if (backend.load === undefined || typeof backend.save !== 'function') {
      console.error('No "load" function provided for backend');
    }

    // debugging functionality
    this.DEBUG_MODE = Boolean(options.DEBUG_MODE);

    window.editor = this;

    // initialize main data structure which holds the graph structure
    this._graphModel = DynamicPositionedGraph.makeEmpty(PedigreeEditorParameters.attributes.layoutRelativePersonWidth, PedigreeEditorParameters.attributes.layoutRelativeOtherWidth);

    //initialize the elements of the app
    this._workspace = new Workspace();
    this._nodeMenu = this.generateNodeMenu();
    this._nodeGroupMenu = this.generateNodeGroupMenu();
    this._partnershipMenu = this.generatePartnershipMenu();
    this._nodetypeSelectionBubble = new NodetypeSelectionBubble(false);
    this._siblingSelectionBubble  = new NodetypeSelectionBubble(true);
    this._disorderLegend = new DisorderLegend();
    this._geneLegend = new GeneLegend();
    this._hpoLegend = new HPOLegend();
    this._fhirTerminologyHelper = options.fhirTerminologyHelper || new DefaultFhirTerminologyHelper();

    this._view = new View();

    this._actionStack = new ActionStack();
    this._templateSelector = new TemplateSelector();
    this._importSelector = new ImportSelector();
    this._exportSelector = new ExportSelector();
    this._versionUpdater = new VersionUpdater();
    this._saveLoadEngine = new SaveLoadEngine(backend);

    // load proband data and load the graph after proband data is available
    this._saveLoadEngine.load(patientDataUrl, this._saveLoadEngine);

    this._controller = new Controller();

    
    //attach actions to buttons on the top bar
    var undoButton = $('action-undo');
    undoButton && undoButton.on('click', function(event) {
      document.fire('pedigree:undo');
    });
    var redoButton = $('action-redo');
    redoButton && redoButton.on('click', function(event) {
      document.fire('pedigree:redo');
    });

    var clearButton = $('action-clear');
    clearButton && clearButton.on('click', function(event) {
      document.fire('pedigree:graph:clear');
    });

    var saveButton = $('action-save');
    saveButton && saveButton.on('click', function(event) {
      editor.getView().unmarkAll();
      if (patientDataUrl) {
        editor.getSaveLoadEngine().save(patientDataUrl);
      }
    });

    var templatesButton = $('action-templates');
    templatesButton && templatesButton.on('click', function(event) {
      editor.getTemplateSelector().show();
    });
    var importButton = $('action-import');
    importButton && importButton.on('click', function(event) {
      editor.getImportSelector().show();
    });
    var exportButton = $('action-export');
    exportButton && exportButton.on('click', function(event) {
      editor.getExportSelector().show();
    });

    var closeButton = $('action-close');
    closeButton && closeButton.on('click', function(event) {
      if (enableAutosave) {
        editor.getSaveLoadEngine().save(patientDataUrl);
      }
      if (returnUrl) {
        window.location = returnUrl;
      }
    });

    var unsupportedBrowserButton = $('action-readonlymessage');
    unsupportedBrowserButton && unsupportedBrowserButton.on('click', function(event) {
      alert('Your browser does not support all the features required for ' +
                  'Pedigree Editor, so pedigree is displayed in read-only mode (and may have quirks).\n\n' +
                  'Supported browsers include Firefox v3.5+, Internet Explorer v9+, ' +
                  'Chrome, Safari v4+, Opera v10.5+ and most mobile browsers.');
    });

    if (enableAutosave) {
      const autosave = this.autosave(patientDataUrl);
      document.observe('pedigree:graph:clear',               autosave);
      document.observe('pedigree:undo',                      autosave);
      document.observe('pedigree:redo',                      autosave);
      document.observe('pedigree:node:remove',               autosave);
      document.observe('pedigree:node:setproperty',          autosave);
      document.observe('pedigree:node:modify',               autosave);
      document.observe('pedigree:person:drag:newparent',     autosave);
      document.observe('pedigree:person:drag:newpartner',    autosave);
      document.observe('pedigree:person:drag:newsibling',    autosave);
      document.observe('pedigree:person:newparent',          autosave);
      document.observe('pedigree:person:newsibling',         autosave);
      document.observe('pedigree:person:newpartnerandchild', autosave);
      document.observe('pedigree:partnership:newchild',      autosave);
    }

  },

  autosave: function(patientDataUrl) {
    return () => {
      editor.getSaveLoadEngine().save(patientDataUrl);
    };
  },

  /**
     * Returns the graph node with the corresponding nodeID
     * @method getNode
     * @param {Number} nodeID The id of the desired node
     * @return {AbstractNode} the node whose id is nodeID
     */
  getNode: function(nodeID) {
    return this.getView().getNode(nodeID);
  },

  /**
     * @method getView
     * @return {View} (responsible for managing graphical representations of nodes and interactive elements)
     */
  getView: function() {
    return this._view;
  },

  /**
     * @method getVersionUpdater
     * @return {VersionUpdater}
     */
  getVersionUpdater: function() {
    return this._versionUpdater;
  },

  /**
     * @method getGraph
     * @return {DynamicPositionedGraph} (data model: responsible for managing nodes and their positions)
     */
  getGraph: function() {
    return this._graphModel;
  },

  /**
     * @method getController
     * @return {Controller} (responsible for managing user input and corresponding data changes)
     */
  getController: function() {
    return this._controller;
  },

  /**
     * @method getActionStack
     * @return {ActionStack} (responsible for undoing and redoing actions)
     */
  getActionStack: function() {
    return this._actionStack;
  },

  /**
     * @method getNodetypeSelectionBubble
     * @return {NodetypeSelectionBubble} (floating window with initialization options for new nodes)
     */
  getNodetypeSelectionBubble: function() {
    return this._nodetypeSelectionBubble;
  },

  /**
     * @method getSiblingSelectionBubble
     * @return {NodetypeSelectionBubble} (floating window with initialization options for new sibling nodes)
     */
  getSiblingSelectionBubble: function() {
    return this._siblingSelectionBubble;
  },

  /**
     * @method getWorkspace
     * @return {Workspace}
     */
  getWorkspace: function() {
    return this._workspace;
  },

  /**
     * @method getDisorderLegend
     * @return {Legend} Responsible for managing and displaying the disorder legend
     */
  getDisorderLegend: function() {
    return this._disorderLegend;
  },

  /**
     * @method getHPOLegend
     * @return {Legend} Responsible for managing and displaying the phenotype/HPO legend
     */
  getHPOLegend: function() {
    return this._hpoLegend;
  },

  /**
     * @method getGeneLegend
     * @return {Legend} Responsible for managing and displaying the candidate genes legend
     */
  getGeneLegend: function() {
    return this._geneLegend;
  },

  getFhirTerminologyHelper: function() {
    return this._fhirTerminologyHelper;
  },

  /**
     * @method getPaper
     * @return {Workspace.paper} Raphael paper element
     */
  getPaper: function() {
    return this.getWorkspace().getPaper();
  },

  /**
     * @method isReadOnlyMode
     * @return {Boolean} True iff pedigree drawn should be read only with no handles
     *                   (read-only mode is used for IE8 as well as for template display and
     *                   print and export versions).
     */
  isReadOnlyMode: function() {
    if (this.isUnsupportedBrowser()) {
      return true;
    }
    return false;
  },

  isUnsupportedBrowser: function() {
    // http://voormedia.com/blog/2012/10/displaying-and-detecting-support-for-svg-images
    if (!document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1')) {
      // implies unpredictable behavior when using handles & interactive elements,
      // and most likely extremely slow on any CPU
      return true;
    }
    // http://kangax.github.io/es5-compat-table/
    if (!window.JSON) {
      // no built-in JSON parser - can't proceed in any way; note that this also implies
      // no support for some other functions such as parsing XML.
      //
      // TODO: include free third-party JSON parser and replace XML with JSON when loading data;
      //       (e.g. https://github.com/douglascrockford/JSON-js)
      //
      //       => at that point all browsers which suport SVG but are treated as unsupported
      //          should theoreticaly start working (FF 3.0, Safari 3 & Opera 9/10 - need to test).
      //          IE7 does not support SVG and JSON and is completely out of the running;
      alert('Your browser is not supported and is unable to load and display any pedigrees.\n\n' +
                  'Suported browsers include Internet Explorer version 9 and higher, Safari version 4 and higher, '+
                  'Firefox version 3.6 and higher, Opera version 10.5 and higher, any version of Chrome and most '+
                  'other modern browsers (including mobile). IE8 is able to display pedigrees in read-only mode.');
      window.stop && window.stop();
      return true;
    }
    return false;
  },

  /**
     * @method getSaveLoadEngine
     * @return {SaveLoadEngine} Engine responsible for saving and loading operations
     */
  getSaveLoadEngine: function() {
    return this._saveLoadEngine;
  },

  /**
     * @method getTemplateSelector
     * @return {TemplateSelector}
     */
  getTemplateSelector: function() {
    return this._templateSelector;
  },

  /**
     * @method getImportSelector
     * @return {ImportSelector}
     */
  getImportSelector: function() {
    return this._importSelector;
  },

  /**
     * @method getExportSelector
     * @return {ExportSelector}
     */
  getExportSelector: function() {
    return this._exportSelector;
  },

  /**
     * Returns true if any of the node menus are visible
     * (since some UI interactions should be disabled while menu is active - e.g. mouse wheel zoom)
     *
     * @method isAnyMenuVisible
     */
  isAnyMenuVisible: function() {
    if (this.getNodeMenu().isVisible() || this.getNodeGroupMenu().isVisible() || this.getPartnershipMenu().isVisible()) {
      return;
    }
  },

  /**
     * Creates the context menu for Person nodes
     *
     * @method generateNodeMenu
     * @return {NodeMenu}
     */
  generateNodeMenu: function() {
    if (this.isReadOnlyMode()) {
      return null;
    }
    var _this = this;
    return new NodeMenu([
      {
        'name' : 'identifier',
        'label' : '',
        'type'  : 'hidden',
        'tab': 'Personal'
      },
      {
        'name' : 'gender',
        'label' : 'Género',
        'type' : 'radio',
        'tab': 'Personal',
        'columns': 3,
        'values' : [
          { 'actual' : 'M', 'displayed' : 'Varón' },
          { 'actual' : 'F', 'displayed' : 'Hembra' },
          { 'actual' : 'U', 'displayed' : 'Desconocido' }
        ],
        'default' : 'U',
        'function' : 'setGender'
      },
      {
        'name' : 'sex_at_birth',
        'label' : 'Sexo asignado al nacer',
        'values' : [{'actual': 'no_info', displayed: 'Sin información / No aplica'},{'actual': 'amab', displayed: 'Asignado masculino al nacer (AMAB)'},{'actual': 'afab', displayed: 'Asignado femenino al nacer (AFAB)'}, {'actual': 'uaab', displayed: 'No asignado al nacer (UAAB)'}],
        'type' : 'select',
        'tab': 'Personal',
        'function' : 'setSexAtBirth'
      },
      {
        'name' : 'first_name',
        'label': 'Nombre',
        'type' : 'text',
        'tab': 'Personal',
        'function' : 'setFirstName'
      },
      {
        'name' : 'last_name',
        'label': 'Apellido',
        'type' : 'text',
        'tab': 'Personal',
        'function' : 'setLastName'
      },
      {
        'name' : 'carrier',
        'label' : 'Estado de portador',
        'type' : 'radio',
        'tab': 'Clínica',
        'values' : [
          { 'actual' : '', 'displayed' : 'No afectado' },
          { 'actual' : 'carrier', 'displayed' : 'Portador' },
          { 'actual' : 'affected', 'displayed' : 'Afectado' },
          { 'actual' : 'presymptomatic', 'displayed' : 'Presintomático' }
        ],
        'default' : '',
        'function' : 'setCarrierStatus'
      },
      {
        'name' : 'consultand',
        'label' : 'Consultante',
        'type' : 'checkbox',
        'tab': 'Clínica',
        'function' : 'setConsultand'
      },
      {
        'name' : 'evaluated',
        'label' : 'Evaluación documentada',
        'type' : 'checkbox',
        'tab': 'Clínica',
        'function' : 'setEvaluated'
      },
      {
        'name' : 'comments',
        'label' : 'Datos de evaluación documentada',
        'type' : 'textarea',
        'tab': 'Clínica',
        'rows' : 2,
        'function' : 'setComments'
      },
      {
        'name' : 'cause_of_death',
        'label': 'Causa de muerte',
        'type' : 'text',
        'tab': 'Clínica',
        'function' : 'setCauseOfDeath'
      },
      {
        'name' : 'karyotype',
        'label': 'Cariotipo',
        'type' : 'text',
        'tab': 'Clínica',
        'function' : 'setKaryotype'
      },
      {
        'name' : 'disorders',
        'label' : 'Trastornos',
        'type' : 'disease-picker',
        'tab': 'Clínica',
        'function' : 'setDisorders'
      },
      {
        'name' : 'candidate_genes',
        'label' : 'Genes',
        'type' : 'gene-picker',
        'tab': 'Clínica',
        'function' : 'setGenes'
      },
      {
        'name' : 'date_of_birth',
        'label' : 'Fecha de nacimiento',
        'type' : 'date-picker',
        'tab': 'Personal',
        'format' : 'dd/MM/yyyy',
        'function' : 'setBirthDate'
      },
      {
        'name' : 'date_of_death',
        'label' : 'Fecha de muerte',
        'type' : 'date-picker',
        'tab': 'Personal',
        'format' : 'dd/MM/yyyy',
        'function' : 'setDeathDate'
      },
      {
        'name' : 'state',
        'label' : 'El individuo se encuentra',
        'type' : 'radio',
        'tab': 'Personal',
        'columns': 3,
        'values' : [
          { 'actual' : 'alive', 'displayed' : 'Vivo' },
          { 'actual' : 'stillborn', 'displayed' : 'Nacido muerto' },
          { 'actual' : 'deceased', 'displayed' : 'Fallecido' },
          { 'actual' : 'miscarriage', 'displayed' : 'Abortado espontáneamente' },
          { 'actual' : 'unborn', 'displayed' : 'No nacido' },
          { 'actual' : 'aborted', 'displayed' : 'Abortado' }
        ],
        'default' : 'alive',
        'function' : 'setLifeStatus'
      },
      {
        'name' : 'gestation_age',
        'label' : 'Edad de gestación',
        'type' : 'select',
        'tab': 'Personal',
        'range' : {'start': 0, 'end': 50, 'item' : ['semana', 'semanas']},
        'nullValue' : true,
        'function' : 'setGestationAge'
      },
      {
        'name' : 'childlessSelect',
        'label' : 'Opciones de herencia',
        'values' : [{'actual': 'none', displayed: 'Ninguna'},{'actual': 'childless', displayed: 'Sin hijos'},{'actual': 'infertile', displayed: 'Estéril'}],
        'type' : 'select',
        'tab': 'Personal',
        'function' : 'setChildlessStatus'
      },
      {
        'name' : 'childless_reason',
        'label': 'Razón de herencia (si aplica y se conoce)',
        'type' : 'text',
        'tab': 'Personal',
        'function' : 'setChildlessReason'
      },
      {
        'name' : 'adoption',
        'label' : 'Opciones de adopción',
        'type' : 'radio',
        'tab': 'Personal',
        'columns': 3,
        'values' : [{'actual': 'none', 'displayed': 'Ninguna'},{'actual': 'adopted_in', 'displayed': 'Adoptado'},{'actual': 'adopted_out', 'displayed': 'Puesto en adopción'}],
        'default' : 'none',
        'function' : 'setAdoptionStatus'
      },
      {
        'name' : 'multiple_gestation',
        'label' : 'Opciones de gestación múltiple',
        'type' : 'radio',
        'tab': 'Personal',
        'columns': 3,
        'values' : [
          { 'actual' : 'non_monozygotic', 'displayed' : 'Gemelo no monocigótico' },
          { 'actual' : 'monozygotic', 'displayed' : 'Gemelo monocigótico' },
          { 'actual' : 'unknown', 'displayed' : 'Desconocido' },
        ],
        'default' : 'non_monozygotic',
        'function' : 'setMultipleGestation'
      },
      {
        'name' : 'unknown_history',
        'label' : 'Historia familiar no disponible o desconocida',
        'type' : 'checkbox',
        'tab': 'Personal',
        'function' : 'setUnknownHistory'
      },
      {
        'name' : 'nocontact',
        'label' : 'No está en contacto con el probando',
        'type' : 'checkbox',
        'tab': 'Personal',
        'function' : 'setLostContact'
      },
      {
        'name' : 'placeholder',
        'label' : 'Nodo marcador de posición',
        'type' : 'checkbox',
        'tab': 'Personal',
        'function' : 'makePlaceholder'
      },
    ], ['Personal', 'Clínica']);
  },

  /**
     * @method getNodeMenu
     * @return {NodeMenu} Context menu for nodes
     */
  getNodeMenu: function() {
    return this._nodeMenu;
  },

  /**
     * Creates the context menu for PersonGroup nodes
     *
     * @method generateNodeGroupMenu
     * @return {NodeMenu}
     */
  generateNodeGroupMenu: function() {
    if (this.isReadOnlyMode()) {
      return null;
    }
    var _this = this;
    return new NodeMenu([
      {
        'name' : 'identifier',
        'label' : '',
        'type'  : 'hidden'
      },
      {
        'name' : 'gender',
        'label' : 'Género',
        'type' : 'radio',
        'columns': 3,
        'values' : [
          { 'actual' : 'M', 'displayed' : 'Varón' },
          { 'actual' : 'F', 'displayed' : 'Hembra' },
          { 'actual' : 'U', 'displayed' : 'Desconocido' }
        ],
        'default' : 'U',
        'function' : 'setGender'
      },
      {
        'name' : 'sex_at_birth',
        'label' : 'Sexo asignado al nacer',
        'values' : [{'actual': 'no_info', displayed: 'Sin información / No aplica'},{'actual': 'amab', displayed: 'Asignado masculino al nacer (AMAB)'},{'actual': 'afab', displayed: 'Asignado femenino al nacer (AFAB)'}, {'actual': 'amab_afab', displayed: 'Mixto (AMAB/AFAB)'}, {'actual': 'uaab', displayed: 'No asignado al nacer (UAAB)'}],
        'type' : 'select',
        'tab': 'Personal',
        'function' : 'setSexAtBirth'
      },
      {
        'name' : 'numInGroup',
        'label': 'Número de personas en este grupo',
        'type' : 'select',
        'values' : [{'actual': 1, displayed: 'N'}, {'actual': 2, displayed: '2'}, {'actual': 3, displayed: '3'},
          {'actual': 4, displayed: '4'}, {'actual': 5, displayed: '5'}, {'actual': 6, displayed: '6'},
          {'actual': 7, displayed: '7'}, {'actual': 8, displayed: '8'}, {'actual': 9, displayed: '9'}],
        'function' : 'setNumPersons'
      },
      {
        'name' : 'disorders',
        'label' : 'Trastornos conocidos<br>(común para todos los individuos de este grupo)',
        'type' : 'disease-picker',
        'function' : 'setDisorders'
      },
      {
        'name' : 'state',
        'label' : 'Todos los individuos de este grupo se encuentran',
        'type' : 'radio',
        'values' : [
          { 'actual' : 'alive', 'displayed' : 'Vivos' },
          { 'actual' : 'aborted', 'displayed' : 'Abortados' },
          { 'actual' : 'deceased', 'displayed' : 'Fallecidos' },
          { 'actual' : 'miscarriage', 'displayed' : 'Abortados espontáneamente' }
        ],
        'default' : 'alive',
        'function' : 'setLifeStatus'
      },
      {
        'name' : 'evaluatedGrp',
        'label' : 'Evaluación documentada',
        'type' : 'checkbox',
        'function' : 'setEvaluated'
      },
      {
        'name' : 'comments',
        'label' : 'Datos de evaluación documentada',
        'type' : 'textarea',
        'rows' : 2,
        'function' : 'setComments'
      },
      {
        'name' : 'adoption',
        'label' : 'Opciones de adopción',
        'type' : 'radio',
        'tab': 'Personal',
        'columns': 3,
        'values' : [{'actual': 'none', 'displayed': 'Ninguna'},{'actual': 'adopted_in', 'displayed': 'Adoptado'},{'actual': 'adopted_out', 'displayed': 'Puesto en adopción'}],
        'default' : 'none',
        'function' : 'setAdoptionStatus'
      },
    ], []);
  },

  /**
     * @method getNodeGroupMenu
     * @return {NodeMenu} Context menu for nodes
     */
  getNodeGroupMenu: function() {
    return this._nodeGroupMenu;
  },

  /**
     * Creates the context menu for Partnership nodes
     *
     * @method generatePartnershipMenu
     * @return {NodeMenu}
     */
  generatePartnershipMenu: function() {
    if (this.isReadOnlyMode()) {
      return null;
    }
    var _this = this;
    return new NodeMenu([
      {
        'name' : 'childlessSelect',
        'label' : 'Opciones de herencia',
        'values' : [{'actual': 'none', displayed: 'Ninguna'},{'actual': 'childless', displayed: 'Sin hijos'},{'actual': 'infertile', displayed: 'Estéril'}],
        'type' : 'select',
        'function' : 'setChildlessStatus'
      },
      {
        'name' : 'consangr',
        'label' : 'Consanguinidad de esta relación',
        'type' : 'radio',
        'values' : [
          { 'actual' : 'A', 'displayed' : 'Automática' },
          { 'actual' : 'Y', 'displayed' : 'Si' },
          { 'actual' : 'N', 'displayed' : 'No' }
        ],
        'default' : 'A',
        'function' : 'setConsanguinity'
      },
      {
        'name' : 'broken',
        'label' : 'Separada',
        'type' : 'checkbox',
        'function' : 'setBrokenStatus'
      }
    ], [], 'relationship-menu');
  },

  /**
     * @method getPartnershipMenu
     * @return {NodeMenu} The context menu for Partnership nodes
     */
  getPartnershipMenu: function() {
    return this._partnershipMenu;
  },

  /**
     * @method convertGraphCoordToCanvasCoord
     * @return [x,y] coordinates on the canvas
     */
  convertGraphCoordToCanvasCoord: function(x, y) {
    var scale = PedigreeEditorParameters.attributes.layoutScale;
    return { x: x * scale.xscale,
      y: y * scale.yscale };
  }
});

export default PedigreeEditor;
