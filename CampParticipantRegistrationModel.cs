using System;
using System.Collections.Generic;

namespace DentaestheticsHMS.Models
{
    /// <summary>
    /// Model for registering camp participants
    /// </summary>
    public class CampParticipantRegistrationModel
    {
        public int ParticipantId { get; set; }
        
        public int CampId { get; set; }
        
        public string CampName { get; set; }
        
        public string ParticipantName { get; set; }
        
        public int Age { get; set; }
        
        public string Gender { get; set; }
        
        public DateTime DateOfBirth { get; set; }
        
        public string PhoneNumber { get; set; }
        
        public string Email { get; set; }
        
        public string ParentGuardianName { get; set; }
        
        public string StudentOrStaff { get; set; }
        
        public string ClassStandard { get; set; }
        
        public string GradeYear { get; set; }
        
        public string RollNumber { get; set; }
        
        public string Department { get; set; }
        
        public List<string> ExistingDentalIssues { get; set; } = new List<string>();
        
        public string MedicalHistory { get; set; }
        
        public string CurrentMedications { get; set; }
        
        public string Allergies { get; set; }
        
        public bool ConsentGiven { get; set; }
        
        public bool PhotoConsent { get; set; }
        
        public DateTime RegistrationDate { get; set; } = DateTime.Now;
        
        public string RegistrationStatus { get; set; } = "Registered";
    }
}
