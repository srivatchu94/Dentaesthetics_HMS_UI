using System;
using System.Collections.Generic;

namespace DentaestheticsHMS.Models
{
    /// <summary>
    /// Model for creating and registering a dental/medical camp
    /// </summary>
    public class CampRegistrationModel
    {
        public int CampId { get; set; }
        
        public string CampName { get; set; }
        
        public string CampType { get; set; }
        
        public DateTime CampDate { get; set; }
        
        public TimeSpan StartTime { get; set; }
        
        public TimeSpan EndTime { get; set; }
        
        public string VenueType { get; set; }
        
        public string InstitutionName { get; set; }
        
        public string Address { get; set; }
        
        public string City { get; set; }
        
        public string State { get; set; }
        
        public string PinCode { get; set; }
        
        public string OrganizedBy { get; set; }
        
        public string ContactPerson { get; set; }
        
        public string ContactNumber { get; set; }
        
        public string ContactEmail { get; set; }
        
        public int ExpectedParticipants { get; set; }
        
        public string TargetAgeGroup { get; set; }
        
        public List<string> ServicesOffered { get; set; } = new List<string>();
        
        public string CampDescription { get; set; }
        
        public string SpecialNotes { get; set; }
        
        public decimal BudgetAllocated { get; set; }
        
        public string SponsorshipDetails { get; set; }
        
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        
        public DateTime? ModifiedDate { get; set; }
        
        public bool IsActive { get; set; } = true;
    }
}
