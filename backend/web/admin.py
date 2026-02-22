from django.contrib import admin
from .models import Profile, Student, Subject, Grade, Attendance

admin.site.register(Profile)
admin.site.register(Student)
admin.site.register(Subject)
admin.site.register(Grade)
admin.site.register(Attendance)
