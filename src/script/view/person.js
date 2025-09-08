import { Timer } from 'pedigree/model/helpers';
import { ChildlessBehavior } from 'pedigree/view/abstractNode';
import AbstractPerson from 'pedigree/view/abstractPerson';
import PersonVisuals from 'pedigree/view/personVisuals';
import HPOTerm from 'pedigree/hpoTerm';
import Disorder from 'pedigree/disorder';
import getAgeCalc from 'pedigree/view/ageCalc';

/**
 * Person is a class representing any AbstractPerson that has sufficient information to be
 * displayed on the final pedigree graph (printed or exported). Person objects
 * contain information about disorders, age and other relevant properties, as well
 * as graphical data to visualize this information.
 *
 * @class Person
 * @constructor
 * @extends AbstractPerson
 * @param {Number} x X coordinate on the Raphael canvas at which the node drawing will be centered
 * @param {Number} y Y coordinate on the Raphael canvas at which the node drawing will be centered
 * @param {String} gender 'M', 'F' or 'U' depending on the gender
 * @param {Number} id Unique ID number
 * @param {Boolean} isProband True if this person is the proband
 */

var Person = Class.create(AbstractPerson, {

  initialize: function($super, x, y, id, properties) {
    //var timer = new Timer();
    this._isProband = (id == 0);
    !this._type && (this._type = 'Person');
    this._setDefault();
    var gender = properties.hasOwnProperty('gender') ? properties['gender'] : 'U';
    $super(x, y, gender, id);

    // need to assign after super() and explicitly pass gender to super()
    // because changing properties requires a redraw, which relies on gender
    // shapes being there already
    this.assignProperties(properties);
    //timer.printSinceLast("=== new person runtime: ");
  },

  _setDefault: function() {
    this._firstName = '';
    this._lastName = '';
    this._lastNameAtBirth = '';
    this._sexAtBirth = 'no_info';
    this._birthDate = '';
    this._deathDate = '';
    this._conceptionDate = '';
    this._gestationAge = '';
    this._adoptionStatus = 'none';
    this._externalID = '';
    this._lifeStatus = 'alive';
    this._childlessReason = '';
    this._childlessStatus = null;
    this._carrierStatus = '';
    this._disorders = [];
    this._hpo = [];
    this._candidateGenes = [];
    this._twinGroup = null;
    this._multipleGestation = '';
    this._consultand = false;
    this._evaluated = false;
    this._unknownHistory = false;
    this._lostContact = false;
    this._karyotype = '';
    this._causeOfDeath = '';
    this._age = '';
  },

  /**
     * Initializes the object responsible for creating graphics for this Person
     *
     * @method _generateGraphics
     * @param {Number} x X coordinate on the Raphael canvas at which the node drawing will be centered
     * @param {Number} y Y coordinate on the Raphael canvas at which the node drawing will be centered
     * @return {PersonVisuals}
     * @private
     */
  _generateGraphics: function(x, y) {
    return new PersonVisuals(this, x, y);
  },

  /**
     * Returns True if this node is the proband (i.e. the main patient)
     *
     * @method isProband
     * @return {Boolean}
     */
  isProband: function() {
    return this._isProband;
  },

  /**
     * Returns the first name of this Person
     *
     * @method getFirstName
     * @return {String}
     */
  getFirstName: function() {
    return this._firstName;
  },

  /**
     * Replaces the first name of this Person with firstName, and displays the label
     *
     * @method setFirstName
     * @param firstName
     */
  setFirstName: function(firstName) {
    firstName && (firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1));
    this._firstName = firstName;
    this.getGraphics().updateNameLabel();
  },

    /**
     * Returns the age of this Person
     *
     * @method getAge
     * @return {String}
     */
    getAge: function() {
      return this._age;
    },
  
    /**
       * Replaces the age of this Person with age, and displays the label
       *
       * @method setAge
       * @param age
       */
    setAge: function(age) {
      this._age = age;
      this.getGraphics().updateAgeLabel();
    },

  /**
     * Returns the last name of this Person
     *
     * @method getLastName
     * @return {String}
     */
  getLastName: function() {
    return this._lastName;
  },

  /**
     * Replaces the last name of this Person with lastName, and displays the label
     *
     * @method setLastName
     * @param lastName
     */
  setLastName: function(lastName) {
    lastName && (lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1));
    this._lastName = lastName;
    this.getGraphics().updateNameLabel();
    return lastName;
  },

    /**
     * Returns the sex at birth of this Person
     *
     * @method getSexAtBirth
     * @return {String}
     */
    getSexAtBirth: function() {
      return this._sexAtBirth;
    },
  
    /**
       * Replaces the sex at birth of this Person with sexAtBirth, and displays the label
       *
       * @method setSexAtBirth
       * @param sexAtBirth
       */
    setSexAtBirth: function(sexAtBirth) {
      this._sexAtBirth = sexAtBirth;
      this.getGraphics().updateSexAtBirthLabel();
    },
  

  /**
     * Returns the externalID of this Person
     *
     * @method getExternalID
     * @return {String}
     */
  getExternalID: function() {
    return this._externalID;
  },

  /**
     * Replaces the external ID of this Person with the given ID, and displays the label
     *
     * @method setExternalID
     * @param externalID
     */
  setExternalID: function(externalID) {
    this._externalID = externalID;
    this.getGraphics().updateExternalIDLabel();
  },

  /**
     * Replaces free-form comments associated with the node and redraws the label
     *
     * @method setComments
     * @param comment
     */
  setComments: function($super, comment) {
    if (comment != this.getComments()) {
      $super(comment);
      this.getGraphics().updateCommentsLabel();
    }
  },

    /**
     * Returns the childless reason
     *
     * @method getChildlessReason
     * @return {String}
     */
    getChildlessReason: function() {
      return this._childlessReason;
    },
  

  /**
     * Replaces childless reason associated with the node and redraws the label
     *
     * @method setChildlessReason
     * @param childlessReason
     */
  setChildlessReason: function(reason) {
    this._childlessReason = reason;
    this.getGraphics().updateChildlessReasonLabel();
  },

      /**
     * Returns the karyotype reason
     *
     * @method getKaryotype
     * @return {String}
     */
      getKaryotype: function() {
        return this._karyotype;
      },
    
  
    /**
       * Replaces karyotype associated with the node and redraws the label
       *
       * @method setKaryotype
       * @param karyotype
       */
    setKaryotype: function(karyotype) {
      this._karyotype = karyotype;
      this.getGraphics().updateKaryotypeLabel();
    },

    /**
     * Sets the type of twin
     *
     * @method setMultipleGestation
     */
    setMultipleGestation: function(gestation) {
      if (gestation == this._multipleGestation) {
        return;
      }
      this._multipleGestation = gestation;
    },

      /**
     * Returns the type of twin: monozygotic or not, and unknown
     * (always empty string for non-twins)
     *
     * @method getMultipleGestation
     * @return {String}
     */
  getMultipleGestation: function() {
    return this._multipleGestation;
  },

      /**
     * Sets unknown history
     *
     * @method setUnknownHistory
     */
      setUnknownHistory: function(history) {
        if (history == this._unknownHistory) {
          return;
        }
        this._unknownHistory = history;
        this.getGraphics().updateUnknownHistoryGraphic();
        console.log(history);
        console.log(this._unknownHistory);
      },
  
        /**
       * Returns the unknown history status
       *
       * @method getUnknownHistory
       * @return {Boolean}
       */
    getUnknownHistory: function() {
      return this._unknownHistory;
    },

  /**
     * Returns the documented evaluation status
     *
     * @method getEvaluated
     * @return {Boolean}
     */
  getEvaluated: function() {
    return this._evaluated;
  },

  /**
     * Sets the documented evaluation status
     *
     * @method setEvaluated
     */
  setEvaluated: function(evaluationStatus) {
    if (evaluationStatus == this._evaluated) {
      return;
    }
    this._evaluated = evaluationStatus;
    this.getGraphics().updateEvaluationLabel();
  },

    /**
     * Returns the consultand status
     *
     * @method getConsultand
     * @return {Boolean}
     */
    getConsultand: function() {
      return this._consultand;
    },
  
    /**
       * Sets the consultand status
       *
       * @method setConsultand
       */
    setConsultand: function(consultandStatus) {
      if (consultandStatus == this._consultand) {
        return;
      }
      this._consultand = consultandStatus;
      this.getGraphics().updateConsultandLabel();
    },

  /**
     * Returns the "in contact" status of this node.
     * "False" means proband has lost contaxt with this individual
     *
     * @method getLostContact
     * @return {Boolean}
     */
  getLostContact: function() {
    return this._lostContact;
  },

  /**
     * Sets the "in contact" status of this node
     *
     * @method setLostContact
     */
  setLostContact: function(lostContact) {
    if (lostContact == this._lostContact) {
      return;
    }
    this._lostContact = lostContact;
  },


  /**
     * Assigns this node to the given twin group
     * (a twin group is all the twins from a given pregnancy)
     *
     * @method setTwinGroup
     */
  setTwinGroup: function(groupId) {
    this._twinGroup = groupId;
  },

  /**
     * Returns the status of this Person
     *
     * @method getLifeStatus
     * @return {String} "alive", "deceased", "stillborn", "unborn", "aborted" or "miscarriage"
     */
  getLifeStatus: function() {
    return this._lifeStatus;
  },

  /**
     * Returns True if this node's status is not 'alive' or 'deceased'.
     *
     * @method isFetus
     * @return {Boolean}
     */
  isFetus: function() {
    return (this.getLifeStatus() != 'alive' && this.getLifeStatus() != 'deceased');
  },

    /**
     * Returns True if this node has parents.
     *
     * @method hasParents
     * @return {Boolean}
     */
    hasParents: function() {
      return (editor.getGraph().getParentRelationship(this.getID()) != null);
    },

  /**
     * Returns True is status is 'unborn', 'stillborn', 'aborted', 'miscarriage', 'alive' or 'deceased'
     *
     * @method _isValidLifeStatus
     * @param {String} status
     * @returns {boolean}
     * @private
     */
  _isValidLifeStatus: function(status) {
    return (status == 'unborn' || status == 'stillborn'
            || status == 'aborted' || status == 'miscarriage'
            || status == 'alive' || status == 'deceased');
  },

  /**
     * Changes the life status of this Person to newStatus
     *
     * @method setLifeStatus
     * @param {String} newStatus "alive", "deceased", "stillborn", "unborn", "aborted" or "miscarriage"
     */
  setLifeStatus: function(newStatus) {
    if(this._isValidLifeStatus(newStatus)) {
      var oldStatus = this._lifeStatus;

      this._lifeStatus = newStatus;
      if(newStatus != 'deceased'){
        this.setDeathDate('')
        this.setCauseOfDeath('');
      }
      (newStatus == 'alive') && this.setGestationAge();
      this.getGraphics().updateSBLabel();

      if(this.isFetus()) {
        this.setBirthDate('');
        this.setAge('');
        this.setAdoptionStatus('none');
        this.setChildlessStatus(null);
        this.setConsultand(false)
      }
      if(!this.isFetus() && this.getKaryotype() && this.getKaryotype() != '') {
        this.setKaryotype('');
      }
      if(newStatus == 'deceased') {
        this.setConsultand(false)
      }
      if(this.isProband()) {
        this.getGraphics().setGenderGraphics();
      }
      this.getGraphics().updateLifeStatusShapes(oldStatus);
      this.getGraphics().getHoverBox().regenerateHandles();
      this.getGraphics().getHoverBox().regenerateButtons();
    }
  },

  /**
     * Returns the date of the conception date of this Person
     *
     * @method getConceptionDate
     * @return {Date}
     */
  getConceptionDate: function() {
    return this._conceptionDate;
  },

  /**
     * Replaces the conception date with newDate
     *
     * @method setConceptionDate
     * @param {Date} newDate Date of conception
     */
  setConceptionDate: function(newDate) {
    this._conceptionDate = newDate ? (new Date(newDate)) : '';
    this.getGraphics().updateAgeLabel();
  },

  /**
     * Returns the number of weeks since conception
     *
     * @method getGestationAge
     * @return {Number}
     */
  getGestationAge: function() {
    if(this.getLifeStatus() == 'unborn' && this.getConceptionDate()) {
      var oneWeek = 1000 * 60 * 60 * 24 * 7,
        lastDay = new Date();
      return Math.round((lastDay.getTime() - this.getConceptionDate().getTime()) / oneWeek);
    } else if(this.isFetus()){
      return this._gestationAge;
    } else {
      return null;
    }
  },

  /**
     * Updates the conception age of the Person given the number of weeks passed since conception
     *
     * @method setGestationAge
     * @param {Number} numWeeks Greater than or equal to 0
     */
  setGestationAge: function(numWeeks) {
    try {
      numWeeks = parseInt(numWeeks);
    } catch (err) {
      numWeeks = '';
    }
    if(numWeeks){
      this._gestationAge = numWeeks;
      var daysAgo = numWeeks * 7,
        d = new Date();
      d.setDate(d.getDate() - daysAgo);
      this.setConceptionDate(d);
    } else {
      this._gestationAge = '';
      this.setConceptionDate(null);
    }
    this.getGraphics().updateAgeLabel();
  },

  /**
     * Returns the the birth date of this Person
     *
     * @method getBirthDate
     * @return {Date}
     */
  getBirthDate: function() {
    return this._birthDate;
  },

  /**
     * Replaces the birth date with newDate
     *
     * @method setBirthDate
     * @param {Date} newDate Must be earlier date than deathDate and a later than conception date
     */
  setBirthDate: function(newDate) {
    newDate = newDate ? (new Date(newDate)) : '';
    if (!newDate || !this.getDeathDate() || newDate.getTime() < this.getDeathDate().getTime()) {
      var deathDate = this.getDeathDate() && this.getDeathDate() !== '' ? this.getDeathDate() : null;
      var age = this._age;
      if (newDate && newDate !== '') {
        age = getAgeCalc(newDate, deathDate);
      }
      else {
        if(this._birthDate && getAgeCalc(this._birthDate, deathDate) === this._age) {
          age = '';
        }
      }
      this._birthDate = newDate;
      this._age = age;
      this.getGraphics().updateAgeLabel();
    }
  },

  /**
     * Returns the death date of this Person
     *
     * @method getDeathDate
     * @return {Date}
     */
  getDeathDate: function() {
    return this._deathDate;
  },

  /**
     * Replaces the death date with deathDate
     *
     *
     * @method setDeathDate
     * @param {Date} deathDate Must be a later date than birthDate
     */
  setDeathDate: function(deathDate) {
    deathDate = deathDate ? (new Date(deathDate)) : '';
    // only set death date if it happens ot be after the birth date, or there is no birth or death date
    if(!deathDate || !this.getBirthDate() || deathDate.getTime() > this.getBirthDate().getTime()) {
      var age = this._age;
      var birthDate = this.getBirthDate() && this.getBirthDate() !== '' ? this.getBirthDate() : null;
      if (birthDate) {
        if (deathDate && deathDate !== '') {
          age = getAgeCalc(birthDate, deathDate);
        }
        else {
          if (getAgeCalc(birthDate, this._deathDate && this._deathDate !== '' ? this._deathDate : null) === this._age) {
            age = getAgeCalc(birthDate, null);
          }
        }
      }
  
      this._deathDate =  deathDate;
      this._age = age;
      this._deathDate && (this.getLifeStatus() == 'alive') && this.setLifeStatus('deceased');
    }
    this.getGraphics().updateAgeLabel();
    return this.getDeathDate();
  },

        /**
     * Returns the cause of death
     *
     * @method getCauseOfDeath
     * @return {String}
     */
        getCauseOfDeath: function() {
          return this._causeOfDeath;
        },
      
    
      /**
         * Replaces cause of death associated with the node and redraws the label
         *
         * @method setCauseOfDeath
         * @param causeOfDeath
         */
      setCauseOfDeath: function(causeOfDeath) {
        this._causeOfDeath = causeOfDeath;
        this.getGraphics().updateAgeLabel();
      },

  _isValidCarrierStatus: function(status) {
    return (status == '' || status == 'carrier'
            || status == 'affected' || status == 'presymptomatic');
  },

  /**
     * Sets the global disorder carrier status for this Person
     *
     * @method setCarrier
     * @param status One of {'', 'carrier', 'affected', 'presymptomatic'}
     */
  setCarrierStatus: function(status) {
    var numDisorders = this.getDisorders().length;

    if (status === undefined || status === null) {
      if (numDisorders == 0) {
        status = '';
      } else {
        status = this.getCarrierStatus();
        if (status == '') {
          status = 'affected';
        }
      }
    }

    if (!this._isValidCarrierStatus(status)) {
      return;
    }

    if (numDisorders > 0 && status == '') {
      if (numDisorders == 1 && this.getDisorders()[0] == 'afectado') {
        this.removeDisorder('afectado');
        this.getGraphics().updateDisorderShapes();
      } else {
        status = 'affected';
      }
    } else if (numDisorders == 0 && status == 'affected') {
      this.addDisorder('afectado');
      this.getGraphics().updateDisorderShapes();
    }

    if (status != this._carrierStatus) {
      this._carrierStatus = status;
      this.getGraphics().updateCarrierGraphic();
    }
  },

  /**
     * Returns the global disorder carrier status for this person.
     *
     * @method getCarrier
     * @return {String} Dissorder carrier status
     */
  getCarrierStatus: function() {
    return this._carrierStatus;
  },

  /**
     * Returns the list of all colors associated with the node
     * (e.g. all colors of all disorders and all colors of all the genes)
     * @method getAllNodeColors
     * @return {Array of Strings}
     */
  getAllNodeColors: function() {
    var result = [];
    for (var i = 0; i < this.getDisorders().length; i++) {
      result.push(editor.getDisorderLegend().getObjectColor(this.getDisorders()[i]));
    }
    for (var i = 0; i < this.getGenes().length; i++) {
      result.push(editor.getGeneLegend().getObjectColor(this.getGenes()[i]));
    }
    return result;
  },

  /**
     * Returns a list of disorders of this person.
     *
     * @method getDisorders
     * @return {Array} List of disorder IDs.
     */
  getDisorders: function() {
    return this._disorders;
  },

  /**
     * Returns a list of disorders of this person, with non-scrambled IDs
     *
     * @method getDisordersForExport
     * @return {Array} List of human-readable versions of disorder IDs
     */
  getDisordersForExport: function() {
    var exportDisorders = this._disorders.slice(0);
    for (var i = 0; i < exportDisorders.length; i++) {
      exportDisorders[i] = Disorder.desanitizeID(exportDisorders[i]);
    }
    return exportDisorders;
  },

  /**
     * Adds disorder to the list of this node's disorders and updates the Legend.
     *
     * @method addDisorder
     * @param {Disorder} disorder Disorder object or a free-text name string
     */
  addDisorder: function(disorder) {
    if (typeof disorder != 'object') {
      disorder = editor.getDisorderLegend().getDisorder(disorder);
    }
    if(!this.hasDisorder(disorder.getDisorderID())) {
      editor.getDisorderLegend().addCase(disorder.getDisorderID(), disorder.getName(), this.getID());
      this.getDisorders().push(disorder.getDisorderID());
    } else {
      alert('Esta persona ya tiene el trastorno especificado');
    }

    // if any "real" disorder has been added
    // the virtual "affected" disorder should be automatically removed
    if (this.getDisorders().length > 1) {
      this.removeDisorder('afectado');
    }
  },

  /**
     * Removes disorder from the list of this node's disorders and updates the Legend.
     *
     * @method removeDisorder
     * @param {Number} disorderID id of the disorder to be removed
     */
  removeDisorder: function(disorderID) {
    if(this.hasDisorder(disorderID)) {
      editor.getDisorderLegend().removeCase(disorderID, this.getID());
      this._disorders = this.getDisorders().without(disorderID);
    } else {
      if (disorderID != 'afectado') {
        alert('Esta persona no tiene el trastorno especificado');
      }
    }
  },

  /**
     * Sets the list of disorders of this person to the given list
     *
     * @method setDisorders
     * @param {Array} disorders List of Disorder objects
     */
  setDisorders: function(disorders) {
    for(var i = this.getDisorders().length-1; i >= 0; i--) {
      this.removeDisorder( this.getDisorders()[i] );
    }
    for(var i = 0; i < disorders.length; i++) {
      this.addDisorder( disorders[i] );
    }
    this.getGraphics().updateDisorderShapes();
    this.setCarrierStatus(); // update carrier status
  },

  /**
     * Returns a list of all HPO terms associated with the patient
     *
     * @method getHPO
     * @return {Array} List of HPO IDs.
     */
  getHPO: function() {
    return this._hpo;
  },

  /**
     * Returns a list of phenotypes of this person, with non-scrambled IDs
     *
     * @method getHPOForExport
     * @return {Array} List of human-readable versions of HPO IDs
     */
  getHPOForExport: function() {
    var exportHPOs = this._hpo.slice(0);
    for (var i = 0; i < exportHPOs.length; i++) {
      exportHPOs[i] = HPOTerm.desanitizeID(exportHPOs[i]);
    }
    return exportHPOs;
  },

  /**
     * Adds HPO term to the list of this node's phenotypes and updates the Legend.
     *
     * @method addHPO
     * @param {HPOTerm} hpo HPOTerm object or a free-text name string
     */
  addHPO: function(hpo) {
    if (typeof hpo != 'object') {
      hpo = editor.getHPOLegend().getTerm(hpo);
    }
    if(!this.hasHPO(hpo.getID())) {
      editor.getHPOLegend().addCase(hpo.getID(), hpo.getName(), this.getID());
      this.getHPO().push(hpo.getID());
    } else {
      alert('This person already has the specified phenotype');
    }
  },

  /**
     * Removes HPO term from the list of this node's terms and updates the Legend.
     *
     * @method removeHPO
     * @param {Number} hpoID id of the term to be removed
     */
  removeHPO: function(hpoID) {
    if(this.hasHPO(hpoID)) {
      editor.getHPOLegend().removeCase(hpoID, this.getID());
      this._hpo = this.getHPO().without(hpoID);
    } else {
      alert('This person doesn\'t have the specified HPO term');
    }
  },

  /**
     * Sets the list of HPO temrs of this person to the given list
     *
     * @method setHPO
     * @param {Array} hpos List of HPOTerm objects
     */
  setHPO: function(hpos) {
    for(var i = this.getHPO().length-1; i >= 0; i--) {
      this.removeHPO( this.getHPO()[i] );
    }
    for(var i = 0; i < hpos.length; i++) {
      this.addHPO( hpos[i] );
    }
  },

  /**
     * @method hasHPO
     * @param {Number} id Term ID, taken from the HPO database
     */
  hasHPO: function(id) {
    return (this.getHPO().indexOf(id) != -1);
  },

  /**
     * Adds gene to the list of this node's candidate genes
     *
     * @method addGenes
     */
  addGene: function(gene) {
    if (this.getGenes().indexOf(gene) == -1) {
      editor.getGeneLegend().addCase(gene, gene, this.getID());
      this.getGenes().push(gene);
    }
  },

  /**
     * Removes gene from the list of this node's candidate genes
     *
     * @method removeGene
     */
  removeGene: function(gene) {
    if (this.getGenes().indexOf(gene) !== -1) {
      editor.getGeneLegend().removeCase(gene, this.getID());
      this._candidateGenes = this.getGenes().without(gene);
    }
  },

  /**
     * Sets the list of candidate genes of this person to the given list
     *
     * @method setGenes
     * @param {Array} genes List of gene names (as strings)
     */
  setGenes: function(genes) {
    for(var i = this.getGenes().length-1; i >= 0; i--) {
      this.removeGene(this.getGenes()[i]);
    }
    for(var i = 0; i < genes.length; i++) {
      this.addGene( genes[i] );
    }
    this.getGraphics().updateDisorderShapes();
  },

  /**
     * Returns a list of candidate genes for this person.
     *
     * @method getGenes
     * @return {Array} List of gene names.
     */
  getGenes: function() {
    return this._candidateGenes;
  },

  /**
     * Removes the node and its visuals.
     *
     * @method remove
     * @param [skipConfirmation=false] {Boolean} if true, no confirmation box will pop up
     */
  remove: function($super) {
    this.setDisorders([]);  // remove disorders form the legend
    this.setHPO([]);
    this.setGenes([]);
    $super();
  },

  /**
     * Returns disorder with given id if this person has it. Returns null otherwise.
     *
     * @method getDisorderByID
     * @param {Number} id Disorder ID, taken from the OMIM database
     * @return {Disorder}
     */
  hasDisorder: function(id) {
    return (this.getDisorders().indexOf(id) != -1);
  },

  /**
     * Changes the childless status of this Person. Nullifies the status if the given status is not
     * "childless" or "infertile". Modifies the status of the partnerships as well.
     *
     * @method setChildlessStatus
     * @param {String} status Can be "childless", "infertile" or null
     * @param {Boolean} ignoreOthers If True, changing the status will not modify partnerships's statuses or
     * detach any children
     */
  setChildlessStatus: function(status) {
    if(!this.isValidChildlessStatus(status)) {
      status = null;
    }
    if(status != this.getChildlessStatus()) {
      this._childlessStatus = status;
      this.getGraphics().updateChildlessShapes();
      this.getGraphics().getHoverBox().regenerateHandles();
    }
    return this.getChildlessStatus();
  },

  /**
     * Returns true if this person is dead
     *
     * @method isDead
     * @return {Boolean}
     */

  isDead: function() {
    return (this.getLifeStatus() == 'deceased');
  },

  /**
     * Returns an object (to be accepted by the menu) with information about this Person
     *
     * @method getSummary
     * @return {Object} Summary object for the menu
     */
  getSummary: function() {
    var onceAlive = editor.getGraph().hasRelationships(this.getID());
    var inactiveStates = onceAlive ? ['unborn','aborted','miscarriage','stillborn'] : false;

    var inactiveGenders = false;
    var genderSet = editor.getGraph().getPossibleGenders(this.getID());
    for (var gender in genderSet) {
      if (genderSet.hasOwnProperty(gender)) {
        if (!genderSet[gender]) {
          inactiveGenders = [ gender ];
        }
      }
    }

    var childlessInactive = this.isFetus();  // TODO: can a person which already has children become childless?
    // maybe: use editor.getGraph().hasNonPlaceholderNonAdoptedChildren() ?
    var disorders = [];
    this.getDisorders().forEach(function(disorder) {
      var disorderName = editor.getDisorderLegend().getDisorder(disorder).getName();
      disorders.push({id: disorder, value: disorderName});
    });
    var hpoTerms = [];
    this.getHPO().forEach(function(hpo) {
      var termName = editor.getHPOLegend().getTerm(hpo).getName();
      hpoTerms.push({id: hpo, value: termName});
    });

    var cantChangeAdopted = this.isFetus() || editor.getGraph().hasToBeAdopted(this.getID());

    var inactiveMonozygothic = true;
    var disableMonozygothic  = true;
    var twins = editor.getGraph().getAllTwinsSortedByOrder(this.getID());
    if (twins.length > 1) {
      // check that there are twins and that all twins
      // have the same gender, otherwise can't be monozygothic
      inactiveMonozygothic = false;
      disableMonozygothic  = false;
      for (var i = 0; i < twins.length; i++) {
        if (editor.getGraph().getGender(twins[i]) != this.getGender()) {
          disableMonozygothic = true;
          break;
        }
      }
    }

    var inactiveCarriers = [];
    if (disorders.length > 0) {
      if (disorders.length != 1 || disorders[0].id != 'afectado') {
        inactiveCarriers = [''];
      }
    }
    if (this.getLifeStatus() == 'aborted' || this.getLifeStatus() == 'miscarriage') {
      inactiveCarriers.push('presymptomatic');
    }

    var inactiveLostContact = this.isProband() || !editor.getGraph().isRelatedToProband(this.getID());
    return {
      identifier:    {value : this.getID()},
      first_name:    {value : this.getFirstName()},
      last_name:     {value : this.getLastName()},
      external_id:   {value : this.getExternalID()},
      gender:        {value : this.getGender()},
      sex_at_birth:  {value : this.getSexAtBirth()},
      date_of_birth: {value : this.getBirthDate(), inactive: this.isFetus()},
      age:           {value : this.getAge(), inactive: this.isFetus()},
      carrier:       {value : this.getCarrierStatus(), disabled: inactiveCarriers},
      karyotype:     {value : this.getKaryotype(), inactive: !this.isFetus()},
      disorders:     {value : disorders},
      candidate_genes: {value : this.getGenes()},
      adoption: {value : this.getAdoptionStatus(), disabled: cantChangeAdopted},
      state:         {value : this.getLifeStatus(), inactive: inactiveStates},
      date_of_death: {value : this.getDeathDate(), inactive: this.isFetus()},
      comments:      {value : this.getComments(), inactive: false},
      cause_of_death: {value : this.getCauseOfDeath(), inactive: !this.isDead()},
      gestation_age: {value : this.getGestationAge(), inactive : !this.isFetus()},
      childless_reason: {value : this.getChildlessReason(), inactive : childlessInactive},
      childlessSelect: {value : this.getChildlessStatus() ? this.getChildlessStatus() : 'none', inactive : childlessInactive},
      placeholder:   {value : false, inactive: true },
      multiple_gestation:   {value : this.getMultipleGestation(), inactive: inactiveMonozygothic, disabled: disableMonozygothic },
      consultand:    {value : this.getConsultand(), inactive: this.isFetus() || this.isProband() || this.isDead()},
      evaluated:     {value : this.getEvaluated() },
      hpo_positive:  {value : hpoTerms},
      unknown_history : {value : this.getUnknownHistory(), inactive: this.hasParents()},
      nocontact:     {value : this.getLostContact(), inactive: inactiveLostContact}
    };
  },

  /**
     * Returns an object containing all the properties of this node
     * except id, x, y & type
     *
     * @method getProperties
     * @return {Object} in the form
     *
     {
       property: value
     }
     */
  getProperties: function($super) {
    // note: properties equivalent to default are not set
    var info = $super();
    if (this.getFirstName() != '') {
      info['fName'] = this.getFirstName();
    }
    if (this.getLastName() != '') {
      info['lName'] = this.getLastName();
    }
    if (this.getExternalID() != '') {
      info['externalID'] = this.getExternalID();
    }
    if (this.getBirthDate() != '') {
      info['dob'] = this.getBirthDate().toDateString();
    }
    if (this.getAge() != '') {
      info['age'] = this.getAge();
    }
    if (this.getAdoptionStatus() && this.getAdoptionStatus() != 'none') {
      info['adoptionStatus'] = this.getAdoptionStatus();
    }
    if (this.getLifeStatus() != 'alive') {
      info['lifeStatus'] = this.getLifeStatus();
    }
    if (this.getDeathDate() != '') {
      info['dod'] = this.getDeathDate().toDateString();
    }
    if (this.getGestationAge() != null) {
      info['gestationAge'] = this.getGestationAge();
    }
    if (this.getChildlessReason() != '') {
      info['childlessReason'] = this.getChildlessReason();
    }
    if (this.getChildlessStatus() != null) {
      info['childlessStatus'] = this.getChildlessStatus();
    }
    if (this.getSexAtBirth() != '') {
      info['sexAtBirth'] = this.getSexAtBirth();
    }
    if (this.getCauseOfDeath() != '') {
      info['causeOfDeath'] = this.getCauseOfDeath();
    }
    if (this.getKaryotype() != '') {
      info['karyotype'] = this.getKaryotype();
    }
    if (this.getDisorders().length > 0) {
      info['disorders'] = this.getDisordersForExport();
    }
    if (this.getHPO().length > 0) {
      info['hpoTerms'] = this.getHPOForExport();
    }
    if (this.getGenes().length > 0) {
      info['candidateGenes'] = this.getGenes();
    }
    if (this._twinGroup !== null) {
      info['twinGroup'] = this._twinGroup;
    }
    if(this._multipleGestation) {
      info['multipleGestation'] = this._multipleGestation;
    }
    if (this._consultand) {
      info['consultand'] = this._consultand;
    }
    if (this._evaluated) {
      info['evaluated'] = this._evaluated;
    }
    if (this._carrierStatus) {
      info['carrierStatus'] = this._carrierStatus;
    }
    if (this._unknownHistory) {
      info['unknownHistory'] = this._unknownHistory;
    }
    if (this.getLostContact()) {
      info['lostContact'] = this.getLostContact();
    }
    return info;
  },

  /**
      * Applies the properties found in info to this node.
      *
      * @method assignProperties
      * @param properties Object
      * @return {Boolean} True if info was successfully assigned
      */
  assignProperties: function($super, info) {
    this._setDefault();

    if($super(info)) {
      if(info.fName && this.getFirstName() != info.fName) {
        this.setFirstName(info.fName);
      }
      if(info.lName && this.getLastName() != info.lName) {
        this.setLastName(info.lName);
      }
      if (info.externalID && this.getExternalID() != info.externalID) {
        this.setExternalID(info.externalID);
      }
      if(info.sexAtBirth && this.getSexAtBirth() != info.sexAtBirth) {
        this.setSexAtBirth(info.sexAtBirth);
      }
      if(info.dob && this.getBirthDate() != info.dob) {
        this.setBirthDate(info.dob);
      }
      if(info.causeOfDeath && this.getCauseOfDeath() != info.causeOfDeath) {
        this.setCauseOfDeath(info.causeOfDeath);
      }
      if(info.age && this.getAge() != info.age) {
        this.setAge(info.age);
      }
      if(info.karyotype && this.getKaryotype() != info.karyotype) {
        this.setKaryotype(info.karyotype);
      }
      if(info.disorders) {
        this.setDisorders(info.disorders);
      }
      if(info.hpoTerms) {
        this.setHPO(info.hpoTerms);
      }
      if(info.candidateGenes) {
        this.setGenes(info.candidateGenes);
      }
      if(info.hasOwnProperty('adoptionStatus') && this.getAdoptionStatus() != info.adoptionStatus) {
        this.setAdoptionStatus(info.adoptionStatus);
      }
      if(info.hasOwnProperty('lifeStatus') && this.getLifeStatus() != info.lifeStatus) {
        this.setLifeStatus(info.lifeStatus);
      }
      if(info.dod && this.getDeathDate() != info.dod) {
        this.setDeathDate(info.dod);
      }
      if(info.gestationAge && this.getGestationAge() != info.gestationAge) {
        this.setGestationAge(info.gestationAge);
      }
      if(info.childlessReason && this.getChildlessReason() != info.childlessReason) {
        this.setChildlessReason(info.childlessReason);
      }
      if(info.childlessStatus && this.getChildlessStatus() != info.childlessStatus) {
        this.setChildlessStatus(info.childlessStatus);
      }
      if(info.hasOwnProperty('twinGroup') && this._twinGroup != info.twinGroup) {
        this.setTwinGroup(info.twinGroup);
      }
      if(info.hasOwnProperty('multipleGestation') && this._multipleGestation != info.multipleGestation) {
        this.setMultipleGestation(info.multipleGestation);
      }
      if(info.hasOwnProperty('consultand') && this._consultand != info.consultand) {
        this.setConsultand(info.consultand);
      }
      if(info.hasOwnProperty('evaluated') && this._evaluated != info.evaluated) {
        this.setEvaluated(info.evaluated);
      }
      if(info.hasOwnProperty('carrierStatus') && this._carrierStatus != info.carrierStatus) {
        this.setCarrierStatus(info.carrierStatus);
      }
      if(info.hasOwnProperty('unknownHistory') && this._unknownHistory != info.unknownHistory) {
        this.setUnknownHistory(info.unknownHistory);
      }
      if (info.hasOwnProperty('lostContact') && this.getLostContact() != info.lostContact) {
        this.setLostContact(info.lostContact);
      }
      return true;
    }
    return false;
  }
});

//ATTACHES CHILDLESS BEHAVIOR METHODS TO THIS CLASS
Person.addMethods(ChildlessBehavior);

export default Person;

