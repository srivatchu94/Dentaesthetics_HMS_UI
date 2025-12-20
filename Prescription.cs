using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DentaestheticsHMS.Models
{
    /// <summary>
    /// Prescription Model - Stores prescription information with multi-level organization hierarchy
    /// </summary>
    [Table("Prescriptions")]
    public class Prescription
    {
        /// <summary>
        /// Primary Key - Unique prescription identifier
        /// </summary>
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PrescriptionId { get; set; }

        /// <summary>
        /// Enterprise identifier - Top-level organization
        /// Required - Every prescription must belong to an enterprise
        /// </summary>
        [Required]
        [ForeignKey("Enterprise")]
        public int EnterpriseId { get; set; }

        /// <summary>
        /// Clinic identifier - Specific clinic within enterprise
        /// Required - Every prescription must be created at a specific clinic
        /// </summary>
        [Required]
        [ForeignKey("Clinic")]
        public int ClinicId { get; set; }

        /// <summary>
        /// Appointment identifier - The appointment this prescription was created for
        /// Required - Prescription is always tied to an appointment
        /// </summary>
        [Required]
        [ForeignKey("Appointment")]
        public int AppointmentId { get; set; }

        /// <summary>
        /// Visit identifier - The patient visit/encounter record
        /// Required - Prescription belongs to a specific visit
        /// </summary>
        [Required]
        [ForeignKey("Visit")]
        public int VisitId { get; set; }

        /// <summary>
        /// Patient identifier - Who the prescription is for
        /// Required - Must know which patient the prescription belongs to
        /// </summary>
        [Required]
        public int PatientId { get; set; }

        /// <summary>
        /// Doctor/Physician identifier - Who prescribed the medication
        /// Required - Must track which doctor issued the prescription
        /// </summary>
        [Required]
        public int DoctorId { get; set; }

        /// <summary>
        /// Prescription date - When the prescription was written
        /// </summary>
        [Required]
        public DateTime PrescriptionDate { get; set; }

        /// <summary>
        /// Prescription expiry date - When the prescription expires
        /// Useful for regulatory compliance and refill tracking
        /// </summary>
        public DateTime? ExpiryDate { get; set; }

        /// <summary>
        /// Number of refills allowed for this prescription
        /// </summary>
        public int? RefillCount { get; set; }

        /// <summary>
        /// JSON or formatted string containing all medications
        /// Example: "Amoxicillin 500mg - 2x daily for 10 days\nIbuprofen 400mg - 1x daily"
        /// </summary>
        [Required]
        [Column(TypeName = "TEXT")]
        public string PrescriptionText { get; set; }

        /// <summary>
        /// Structured medication list stored as JSON
        /// Allows for more sophisticated queries on individual medications
        /// Example: [{"name":"Amoxicillin","dosage":"500mg","frequency":"2x daily","duration":"10 days","instructions":"Take with water"}]
        /// </summary>
        [Column(TypeName = "TEXT")]
        public string MedicationsJson { get; set; }

        /// <summary>
        /// Special instructions or notes for the patient
        /// Example: "Take with food", "Avoid dairy products", etc.
        /// </summary>
        [Column(TypeName = "TEXT")]
        public string SpecialInstructions { get; set; }

        /// <summary>
        /// Additional notes from the doctor
        /// Example: "Follow up if symptoms persist"
        /// </summary>
        [Column(TypeName = "TEXT")]
        public string Notes { get; set; }

        /// <summary>
        /// Prescription status
        /// Active = Currently valid
        /// Expired = Passed expiry date
        /// Cancelled = Doctor cancelled it
        /// Completed = All medications have been dispensed
        /// </summary>
        [Required]
        [MaxLength(20)]
        [DefaultValue("Active")]
        public string Status { get; set; } = "Active";

        /// <summary>
        /// Flag to indicate if prescription is verified by doctor
        /// </summary>
        [DefaultValue(true)]
        public bool IsVerified { get; set; } = true;

        /// <summary>
        /// Audit trail - When the record was created
        /// </summary>
        [Required]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Audit trail - Username/ID of who created the record
        /// </summary>
        [MaxLength(100)]
        public string CreatedBy { get; set; }

        /// <summary>
        /// Audit trail - When the record was last modified
        /// </summary>
        public DateTime? ModifiedDate { get; set; }

        /// <summary>
        /// Audit trail - Username/ID of who last modified the record
        /// </summary>
        [MaxLength(100)]
        public string ModifiedBy { get; set; }

        /// <summary>
        /// Soft delete flag - Records are not physically deleted
        /// </summary>
        [DefaultValue(false)]
        public bool IsDeleted { get; set; } = false;

        /// <summary>
        /// When the record was deleted (if IsDeleted = true)
        /// </summary>
        public DateTime? DeletedDate { get; set; }

        /// <summary>
        /// Who deleted the record
        /// </summary>
        [MaxLength(100)]
        public string DeletedBy { get; set; }

        // Navigation Properties
        // Uncomment if using Entity Framework with related tables

        // [ForeignKey(nameof(EnterpriseId))]
        // public virtual Enterprise Enterprise { get; set; }

        // [ForeignKey(nameof(ClinicId))]
        // public virtual Clinic Clinic { get; set; }

        // [ForeignKey(nameof(AppointmentId))]
        // public virtual Appointment Appointment { get; set; }

        // [ForeignKey(nameof(VisitId))]
        // public virtual PatientVisit Visit { get; set; }

        // [ForeignKey(nameof(PatientId))]
        // public virtual Patient Patient { get; set; }

        // [ForeignKey(nameof(DoctorId))]
        // public virtual Doctor Doctor { get; set; }

        // One prescription can have multiple prescription items (for better normalization)
        // public virtual ICollection<PrescriptionItem> PrescriptionItems { get; set; } = new List<PrescriptionItem>();

        // Prescriptions can be linked to dispensary records for tracking
        // public virtual ICollection<DispensaryRecord> DispensaryRecords { get; set; } = new List<DispensaryRecord>();
    }

    /// <summary>
    /// Optional: PrescriptionItem model for better normalization
    /// Use this if you want to store each medication as a separate row
    /// </summary>
    [Table("PrescriptionItems")]
    public class PrescriptionItem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PrescriptionItemId { get; set; }

        [Required]
        [ForeignKey("Prescription")]
        public int PrescriptionId { get; set; }

        /// <summary>
        /// Medication name
        /// </summary>
        [Required]
        [MaxLength(255)]
        public string MedicationName { get; set; }

        /// <summary>
        /// Generic name of the medication
        /// </summary>
        [MaxLength(255)]
        public string GenericName { get; set; }

        /// <summary>
        /// Dosage strength (e.g., "500mg", "10ml")
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string Dosage { get; set; }

        /// <summary>
        /// Dosage form (e.g., "tablet", "capsule", "liquid")
        /// </summary>
        [MaxLength(50)]
        public string DosageForm { get; set; }

        /// <summary>
        /// Frequency of administration (e.g., "2x daily", "3x daily", "as needed")
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string Frequency { get; set; }

        /// <summary>
        /// Duration of medication course (e.g., "10 days", "2 weeks")
        /// </summary>
        [MaxLength(50)]
        public string Duration { get; set; }

        /// <summary>
        /// Special instructions for this medication
        /// (e.g., "Take with water", "Take after meals", "Avoid dairy products")
        /// </summary>
        [MaxLength(500)]
        public string Instructions { get; set; }

        /// <summary>
        /// Quantity prescribed
        /// </summary>
        public int? Quantity { get; set; }

        /// <summary>
        /// Unit of quantity (e.g., "tablets", "ml", "units")
        /// </summary>
        [MaxLength(50)]
        public string Unit { get; set; }

        /// <summary>
        /// Medication category or type
        /// </summary>
        [MaxLength(100)]
        public string Category { get; set; }

        /// <summary>
        /// Manufacturer information
        /// </summary>
        [MaxLength(255)]
        public string Manufacturer { get; set; }

        /// <summary>
        /// Quantity dispensed so far
        /// </summary>
        public int? QuantityDispensed { get; set; }

        /// <summary>
        /// Reference to inventory item if exists
        /// </summary>
        public int? InventoryItemId { get; set; }

        /// <summary>
        /// Sequence/order in prescription list
        /// </summary>
        public int? Sequence { get; set; }

        // Audit fields
        [Required]
        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        [MaxLength(100)]
        public string CreatedBy { get; set; }

        public DateTime? ModifiedDate { get; set; }

        [MaxLength(100)]
        public string ModifiedBy { get; set; }

        // Navigation property
        // [ForeignKey(nameof(PrescriptionId))]
        // public virtual Prescription Prescription { get; set; }
    }
}
