namespace PracticeOps.Api;

public sealed record DashboardMetrics(
    int AppointmentsToday,
    int UnsignedNotes,
    int ClaimsAtRisk,
    decimal ClaimExposure,
    int TeamUtilization);

public static class DashboardMetricsCalculator
{
    private const int DailyClinicianCapacity = 7;

    public static DashboardMetrics Calculate(
        IReadOnlyCollection<Appointment> appointments,
        IReadOnlyCollection<ClinicalNote> notes,
        IReadOnlyCollection<Claim> claims)
    {
        var activeAppointments = appointments.Count(appointment =>
            appointment.Status is not AppointmentStatus.Cancelled);
        var clinicians = appointments
            .Select(appointment => appointment.Clinician)
            .Distinct(StringComparer.Ordinal)
            .Count();
        var capacity = clinicians * DailyClinicianCapacity;
        var atRiskClaims = claims
            .Where(claim => claim.Status is ClaimStatus.NeedsReview or ClaimStatus.Denied)
            .ToArray();

        return new DashboardMetrics(
            AppointmentsToday: appointments.Count,
            UnsignedNotes: notes.Count(note => note.Status != NoteStatus.Signed),
            ClaimsAtRisk: atRiskClaims.Length,
            ClaimExposure: atRiskClaims.Sum(claim => claim.Amount),
            TeamUtilization: capacity == 0
                ? 0
                : Math.Clamp((int)Math.Round(activeAppointments * 100m / capacity), 0, 100));
    }
}
