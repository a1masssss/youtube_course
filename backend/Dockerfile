FROM python:3.13
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1 
RUN pip install --upgrade pip 
COPY . .
RUN pip install --no-cache-dir -r requirements.txt
EXPOSE 8001





# FROM python:3.13
# WORKDIR /app
# ENV PYTHONDONTWRITEBYTECODE=1
# ENV PYTHONUNBUFFERED=1
# RUN pip install --upgrade pip
# COPY . .
# RUN pip install --no-cache-dir -r requirements.txt
# EXPOSE 8001
# CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8001"]