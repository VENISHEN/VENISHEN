from flask import Flask, render_template

app = Flask(__name__)

@app.route('/user/<name>')
def index(name):
    if name.lower() == "admin":
        return render_template('admin.html')
    else:
        return render_template('guest.html')

if __name__ == '__main__':
    app.run()
