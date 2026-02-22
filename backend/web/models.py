from django.contrib.auth.models import User
from django.db import models


class Profile(models.Model):
    ROLE_CHOICES = (
        ("ADMIN", "Administrateur"),
        ("PROF", "Professeur"),
        ("STUDENT", "Etudiant"),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    telephone = models.CharField(max_length=20, blank=True)
    adresse = models.TextField(blank=True)
    date_naissance = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"


class Student(models.Model):
    NIVEAU_CHOICES = (
        ("L1", "Licence 1"),
        ("L2", "Licence 2"),
        ("L3", "Licence 3"),
        ("M1", "Master 1"),
        ("M2", "Master 2"),
    )

    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, limit_choices_to={"role": "STUDENT"})
    matricule = models.CharField(max_length=20, unique=True)
    nom = models.CharField(max_length=150)
    prenom = models.CharField(max_length=150)
    classe = models.CharField(max_length=2, choices=NIVEAU_CHOICES)
    date_inscription = models.DateField(auto_now_add=True)
    date_naissance = models.DateField(blank=True, null=True)
    telephone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.nom} {self.prenom}"


class Subject(models.Model):
    name = models.CharField(max_length=100)
    coefficient = models.IntegerField(default=1)

    def __str__(self):
        return self.name


class Grade(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    value = models.FloatField()
    date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.student} - {self.subject} : {self.value}"


class Attendance(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    date = models.DateField()
    present = models.BooleanField(default=True)
    justified = models.BooleanField(default=False)
