from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def index(request):
    return render(request, 'index.html')

def about(request):
    return render(request, 'about.html')    

def contact(request):
    return render(request, 'contact.html')

def services(request):
    return render(request, 'services.html')

def portfolio(request):
    return render(request, 'portfolio.html')

def blog(request):
    return render(request, 'blog.html')

def blog_single(request):
    return render(request, 'blog-single.html')

def elements(request):
    return render(request, 'elements.html')

def team(request):
    return render(request, 'team.html')

def pricing(request):
    return render(request, 'pricing.html')

def faq(request):
    return render(request, 'faq.html')

def testimonials(request):
    return render(request, 'testimonials.html')
