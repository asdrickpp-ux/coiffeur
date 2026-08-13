"use strict";

/* =========================================================
   COIFF'BOOST V10.2
   Application locale pour coiffeuse
   ========================================================= */

const APP_NAME = "COIFF'BOOST";
const APP_VERSION = "10.2";
const STORAGE_KEY = "coiffboost_data";
const OWNER_CODE = "AUDREY";

/* =========================================================
   ABONNEMENTS
   ========================================================= */

const PLANS = {
    FREE: {
        name: "Gratuit",
        price: 0,
        features: {
            clients: true,
            appointments: true,
            calculator: true,
            invoices: true,
            pdf: true,
            statistics: false,
            products: false
        }
    },

    PRO: {
        name: "Pro",
        price: 9.99,
        features: {
            clients: true,
            appointments: true,
            calculator: true,
            invoices: true,
            pdf: true,
            statistics: true,
            products: true
        }
    },

    PREMIUM: {
        name: "Premium",
        price: 19.99,
        features: {
            clients: true,
            appointments: true,
            calculator: true,
            invoices: true,
            pdf: true,
            statistics: true,
            products: true
        }
    }
};

/* =========================================================
   ETAT
   ========================================================= */

let state = {
    plan: "FREE",
    ownerUnlocked: false,

    settings: {
        salon: "",
        owner: "",
        phone: "",
        address: ""
    },

    clients: [],
    appointments: [],
    services: [],
    products: [],
    invoices: [],

    calendarDate: getToday()
};

/* =========================================================
   INITIALISATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    loadData();
    initialiseDefaults();
    setupEvents();
    renderAll();
    navigate("dashboard");
});

/* =========================================================
   STOCKAGE
   ========================================================= */

function saveData() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(state)
        );
    } catch (error) {
        console.error("Erreur sauvegarde :", error);
        showToast("Erreur lors de la sauvegarde.");
    }
}

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) return;

        const parsed = JSON.parse(saved);

        state = {
            ...state,
            ...parsed,

            settings: {
                ...state.settings,
                ...(parsed.settings || {})
            },

            clients: Array.isArray(parsed.clients)
                ? parsed.clients
                : [],

            appointments: Array.isArray(parsed.appointments)
                ? parsed.appointments
                : [],

            services: Array.isArray(parsed.services)
                ? parsed.services
                : [],

            products: Array.isArray(parsed.products)
                ? parsed.products
                : [],

            invoices: Array.isArray(parsed.invoices)
                ? parsed.invoices
                : []
        };

    } catch (error) {
        console.error("Erreur chargement :", error);
        showToast("Les données sauvegardées sont invalides.");
    }
}

/* =========================================================
   DONNEES PAR DEFAUT
   ========================================================= */

function initialiseDefaults() {

    if (state.services.length === 0) {

        state.services = [
            {
                id: uid(),
                name: "Coupe femme",
                duration: 60,
                price: 35,
                cost: 4
            },

            {
                id: uid(),
                name: "Brushing",
                duration: 45,
                price: 25,
                cost: 2
            },

            {
                id: uid(),
                name: "Coupe homme",
                duration: 30,
                price: 22,
                cost: 2
            },

            {
                id: uid(),
                name: "Coloration",
                duration: 120,
                price: 70,
                cost: 15
            }
        ];

        saveData();
    }
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function navigate(page) {

    document.querySelectorAll(".page").forEach(element => {
        element.classList.remove("active");
    });

    const target = document.getElementById(`page-${page}`);

    if (!target) {
        console.error(`Page introuvable : page-${page}`);
        return;
    }

    target.classList.add("active");

    document.querySelectorAll("[data-nav]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.nav === page
        );
    });

    switch (page) {

        case "dashboard":
            renderDashboard();
            break;

        case "planning":
            renderCalendar();
            renderAppointments();
            break;

        case "clients":
            renderClients();
            break;

        case "services":
            renderServices();
            break;

        case "calculator":
            resetCalculatorResult();
            break;

        case "invoice":
            renderInvoiceHistory();
            break;

        case "products":
            renderProducts();
            break;

        case "statistics":
            renderStatistics();
            break;

        case "subscription":
            updateSubscriptionPage();
            break;

        case "settings":
            renderSettings();
            break;
    }
}

/* =========================================================
   RENDU GLOBAL
   ========================================================= */

function renderAll() {

    renderDashboard();
    renderClients();
    renderServices();
    renderAppointments();
    renderCalendar();
    renderInvoiceHistory();
    renderProducts();
    renderStatistics();
    renderSettings();
    updateSubscriptionPage();
    updateSalonHeader();
    applyPlanRestrictions();
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function renderDashboard() {

    setText(
        "dashboardRevenue",
        formatMoney(calculateRevenue())
    );

    setText(
        "dashboardToday",
        countTodayAppointments()
    );

    setText(
        "dashboardClients",
        state.clients.length
    );

    setText(
        "dashboardInvoices",
        state.invoices.length
    );

    const container =
        document.getElementById("dashboardAppointments");

    if (!container) return;

    const upcoming = [...state.appointments]
        .filter(item => {

            const date = new Date(
                `${item.date}T${item.time || "00:00"}`
            );

            return date >= new Date();

        })
        .sort(sortAppointments)
        .slice(0, 5);

    if (upcoming.length === 0) {

        container.innerHTML = `
            <div class="list-empty">
                Aucun prochain rendez-vous.
            </div>
        `;

        return;
    }

    container.innerHTML =
        upcoming.map(item => appointmentHTML(item)).join("");
}

/* =========================================================
   CLIENTS
   ========================================================= */

function openClientModal() {

    clearFields([
        "clientName",
        "clientPhone",
        "clientNotes"
    ]);

    openModal("clientModal");
}

function saveClient() {

    const name = valueOf("clientName");
    const phone = valueOf("clientPhone");
    const notes = valueOf("clientNotes");

    if (!name) {
        showToast("Indiquez le nom de la cliente.");
        return;
    }

    state.clients.push({
        id: uid(),
        name,
        phone,
        notes,
        createdAt: new Date().toISOString()
    });

    saveData();

    closeModal("clientModal");

    renderClients();
    renderDashboard();

    showToast("Cliente ajoutée.");
}

function renderClients() {

    const container =
        document.getElementById("clientsList");

    if (!container) return;

    const search =
        valueOf("clientSearch").toLowerCase();

    const clients =
        state.clients.filter(client => {

            return (
                client.name
                    .toLowerCase()
                    .includes(search)
                ||
                (client.phone || "")
                    .includes(search)
            );

        });

    if (clients.length === 0) {

        container.innerHTML = `
            <div class="list-empty">
                Aucune cliente trouvée.
            </div>
        `;

        return;
    }

    container.innerHTML =
        clients.map(client => {

            const revenue =
                state.invoices
                    .filter(invoice =>
                        invoice.client === client.name
                    )
                    .reduce(
                        (total, invoice) =>
                            total + Number(invoice.total || 0),
                        0
                    );

            return `
                <div class="list-item">

                    <div class="list-avatar">
                        ${initials(client.name)}
                    </div>

                    <div class="list-content">

                        <strong>
                            ${escapeHTML(client.name)}
                        </strong>

                        <small>
                            ${escapeHTML(
                                client.phone || "Aucun téléphone"
                            )}
                        </small>

                        <small>
                            CA :
                            ${formatMoney(revenue)}
                        </small>

                    </div>

                    <div class="list-actions">

                        <button
                            class="small-btn"
                            onclick="editClient('${client.id}')">
                            ✏️
                        </button>

                        <button
                            class="small-btn"
                            onclick="deleteClient('${client.id}')">
                            🗑️
                        </button>

                    </div>

                </div>
            `;

        }).join("");
}

function editClient(id) {

    const client =
        state.clients.find(item => item.id === id);

    if (!client) return;

    const name =
        prompt("Nom de la cliente", client.name);

    if (name === null || !name.trim()) return;

    const phone =
        prompt("Téléphone", client.phone || "");

    const notes =
        prompt("Notes", client.notes || "");

    client.name = name.trim();
    client.phone = phone || "";
    client.notes = notes || "";

    saveData();

    renderClients();
    renderDashboard();

    showToast("Cliente modifiée.");
}

function deleteClient(id) {

    const client =
        state.clients.find(item => item.id === id);

    if (!client) return;

    if (!confirm(`Supprimer ${client.name} ?`)) return;

    state.clients =
        state.clients.filter(item => item.id !== id);

    saveData();

    renderClients();
    renderDashboard();

    showToast("Cliente supprimée.");
}

/* =========================================================
   RENDEZ-VOUS
   ========================================================= */

function openAppointmentModal() {

    clearFields([
        "appointmentClient",
        "appointmentService",
        "appointmentPrice"
    ]);

    setValue(
        "appointmentDate",
        getToday()
    );

    setValue(
        "appointmentTime",
        "10:00"
    );

    openModal("appointmentModal");
}

function saveAppointment() {

    const client =
        valueOf("appointmentClient");

    const date =
        valueOf("appointmentDate");

    const time =
        valueOf("appointmentTime");

    const service =
        valueOf("appointmentService");

    const price =
        Number(valueOf("appointmentPrice") || 0);

    if (!client || !date || !time) {
        showToast("Complétez la cliente, la date et l'heure.");
        return;
    }

    state.appointments.push({
        id: uid(),
        client,
        date,
        time,
        service,
        price,
        status: "planned",
        createdAt: new Date().toISOString()
    });

    saveData();

    closeModal("appointmentModal");

    renderAppointments();
    renderCalendar();
    renderDashboard();

    showToast("Rendez-vous ajouté.");
}

function renderAppointments() {

    const container =
        document.getElementById("appointmentsList");

    if (!container) return;

    const appointments =
        [...state.appointments].sort(sortAppointments);

    if (appointments.length === 0) {

        container.innerHTML = `
            <div class="list-empty">
                Aucun rendez-vous.
            </div>
        `;

        return;
    }

    container.innerHTML =
        appointments
            .map(item => appointmentHTML(item, true))
            .join("");
}

function appointmentHTML(
    appointment,
    detailed = false
) {

    let statusText = "Prévue";
    let statusClass = "status-planned";

    if (appointment.status === "done") {
        statusText = "Terminée";
        statusClass = "status-done";
    }

    if (appointment.status === "cancelled") {
        statusText = "Annulée";
        statusClass = "status-cancelled";
    }

    return `
        <div class="list-item">

            <div class="list-avatar">
                📅
            </div>

            <div class="list-content">

                <strong>
                    ${escapeHTML(appointment.client)}
                </strong>

                <small>
                    ${formatDate(appointment.date)}
                    à
                    ${escapeHTML(appointment.time || "")}
                </small>

                <small>
                    ${escapeHTML(
                        appointment.service || "Prestation"
                    )}
                </small>

                ${
                    detailed
                        ? `
                            <span class="status ${statusClass}">
                                ${statusText}
                            </span>
                        `
                        : ""
                }

            </div>

            <div class="list-actions">

                <span class="list-price">
                    ${formatMoney(appointment.price)}
                </span>

                ${
                    detailed
                        ? `
                            <button
                                class="small-btn"
                                onclick="toggleAppointmentStatus('${appointment.id}')">
                                ✓
                            </button>

                            <button
                                class="small-btn"
                                onclick="deleteAppointment('${appointment.id}')">
                                🗑️
                            </button>
                        `
                        : ""
                }

            </div>

        </div>
    `;
}

function toggleAppointmentStatus(id) {

    const appointment =
        state.appointments.find(item => item.id === id);

    if (!appointment) return;

    if (appointment.status === "planned") {
        appointment.status = "done";
    } else if (appointment.status === "done") {
        appointment.status = "cancelled";
    } else {
        appointment.status = "planned";
    }

    saveData();

    renderAppointments();
    renderDashboard();

    showToast("Statut modifié.");
}

function deleteAppointment(id) {

    if (!confirm("Supprimer ce rendez-vous ?")) {
        return;
    }

    state.appointments =
        state.appointments.filter(
            item => item.id !== id
        );

    saveData();

    renderAppointments();
    renderCalendar();
    renderDashboard();

    showToast("Rendez-vous supprimé.");
}

/* =========================================================
   CALENDRIER
   ========================================================= */

function changeCalendar(direction) {

    const current =
        new Date(state.calendarDate);

    current.setMonth(
        current.getMonth() + direction
    );

    state.calendarDate =
        `${current.getFullYear()}-${String(
            current.getMonth() + 1
        ).padStart(2, "0")}-01`;

    renderCalendar();
}

function renderCalendar() {

    const calendar =
        document.getElementById("calendar");

    const title =
        document.getElementById("calendarTitle");

    if (!calendar || !title) return;

    const current =
        new Date(state.calendarDate);

    const year =
        current.getFullYear();

    const month =
        current.getMonth();

    title.textContent =
        current.toLocaleDateString(
            "fr-FR",
            {
                month: "long",
                year: "numeric"
            }
        );

    const firstDay =
        new Date(year, month, 1);

    const lastDay =
        new Date(year, month + 1, 0);

    let start =
        firstDay.getDay();

    start =
        start === 0
            ? 6
            : start - 1;

    let html = `
        <div class="calendar-day-name">L</div>
        <div class="calendar-day-name">M</div>
        <div class="calendar-day-name">M</div>
        <div class="calendar-day-name">J</div>
        <div class="calendar-day-name">V</div>
        <div class="calendar-day-name">S</div>
        <div class="calendar-day-name">D</div>
    `;

    for (let i = 0; i < start; i++) {

        html += `
            <div class="calendar-day empty"></div>
        `;
    }

    for (
        let day = 1;
        day <= lastDay.getDate();
        day++
    ) {

        const date =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const hasEvent =
            state.appointments.some(
                appointment =>
                    appointment.date === date
            );

        const today =
            date === getToday();

        html += `
            <div
                class="calendar-day
                ${today ? "today" : ""}
                ${hasEvent ? "has-event" : ""}"
                onclick="selectCalendarDate('${date}')">

                ${day}

            </div>
        `;
    }

    calendar.innerHTML = html;
}

function selectCalendarDate(date) {

    state.calendarDate = date;

    renderCalendar();

    const count =
        state.appointments.filter(
            appointment =>
                appointment.date === date
        ).length;

    showToast(
        count
            ? `${count} rendez-vous le ${formatDate(date)}`
            : `Aucun rendez-vous le ${formatDate(date)}`
    );
}

/* =========================================================
   SERVICES
   ========================================================= */

function openServiceModal() {

    clearFields([
        "serviceName",
        "servicePrice",
        "serviceCost"
    ]);

    setValue("serviceDuration", 60);

    openModal("serviceModal");
}

function saveService() {

    const name =
        valueOf("serviceName");

    const duration =
        Number(valueOf("serviceDuration") || 0);

    const price =
        Number(valueOf("servicePrice") || 0);

    const cost =
        Number(valueOf("serviceCost") || 0);

    if (!name) {
        showToast("Indiquez le nom de la prestation.");
        return;
    }

    state.services.push({
        id: uid(),
        name,
        duration,
        price,
        cost
    });

    saveData();

    closeModal("serviceModal");

    renderServices();

    showToast("Prestation ajoutée.");
}

function renderServices() {

    const container =
        document.getElementById("servicesList");

    if (!container) return;

    if (state.services.length === 0) {

        container.innerHTML = `
            <div class="list-empty">
                Aucune prestation.
            </div>
        `;

        return;
    }

    container.innerHTML =
        state.services.map(service => {

            const margin =
                Number(service.price || 0) -
                Number(service.cost || 0);

            return `
                <div class="list-item">

                    <div class="list-avatar">
                        ✂️
                    </div>

                    <div class="list-content">

                        <strong>
                            ${escapeHTML(service.name)}
                        </strong>

                        <small>
                            ${service.duration} min
                        </small>

                        <small>
                            Marge :
                            ${formatMoney(margin)}
                        </small>

                    </div>

                    <div class="list-actions">

                        <span class="list-price">
                            ${formatMoney(service.price)}
                        </span>

                        <button
                            class="small-btn"
                            onclick="editService('${service.id}')">
                            ✏️
                        </button>

                        <button
                            class="small-btn"
                            onclick="deleteService('${service.id}')">
                            🗑️
                        </button>

                    </div>

                </div>
            `;

        }).join("");
}

function editService(id) {

    const service =
        state.services.find(item => item.id === id);

    if (!service) return;

    const name =
        prompt("Nom", service.name);

    if (name === null) return;

    const price =
        prompt("Prix", service.price);

    const duration =
        prompt("Durée en minutes", service.duration);

    const cost =
        prompt("Coût produits", service.cost);

    service.name = name.trim();
    service.price = Number(price || 0);
    service.duration = Number(duration || 0);
    service.cost = Number(cost || 0);

    saveData();

    renderServices();

    showToast("Prestation modifiée.");
}

function deleteService(id) {

    if (!confirm("Supprimer cette prestation ?")) {
        return;
    }

    state.services =
        state.services.filter(
            service => service.id !== id
        );

    saveData();

    renderServices();

    showToast("Prestation supprimée.");
}

/* =========================================================
   CALCULATEUR
   ========================================================= */

function calculatePrice() {

    const name =
        valueOf("calculatorName");

    const minutes =
        Number(valueOf("calculatorMinutes") || 0);

    const hourly =
        Number(valueOf("calculatorHourly") || 0);

    const products =
        Number(valueOf("calculatorProducts") || 0);

    const charges =
        Number(valueOf("calculatorCharges") || 0);

    const margin =
        Number(valueOf("calculatorMargin") || 0);

    if (minutes <= 0 || hourly <= 0) {

        showToast(
            "Indiquez une durée et un taux horaire."
        );

        return;
    }

    const labor =
        minutes / 60 * hourly;

    const cost =
        labor + products + charges;

    const recommended =
        cost * (1 + margin / 100);

    const result =
        document.getElementById("calculatorResult");

    if (!result) return;

    result.innerHTML = `
        <small>
            ${escapeHTML(name || "Tarif conseillé")}
        </small>

        <strong>
            ${formatMoney(recommended)}
        </strong>

        <p>
            Coût :
            ${formatMoney(cost)}
            ·
            Prix minimum :
            ${formatMoney(cost)}
        </p>
    `;
}

function resetCalculatorResult() {

    const result =
        document.getElementById("calculatorResult");

    if (!result) return;

    result.innerHTML = `
        <small>Tarif conseillé</small>
        <strong>0 €</strong>
        <p>Remplissez les informations.</p>
    `;
}

/* =========================================================
   PRODUITS
   ========================================================= */

function openProductModal() {

    if (!hasFeature("products")) {
        showProMessage();
        return;
    }

    clearFields([
        "productName",
        "productPrice",
        "productStock"
    ]);

    setValue("productStock", 1);

    openModal("productModal");
}

function saveProduct() {

    if (!hasFeature("products")) {
        showProMessage();
        return;
    }

    const name =
        valueOf("productName");

    const price =
        Number(valueOf("productPrice") || 0);

    const stock =
        Number(valueOf("productStock") || 0);

    if (!name) {
        showToast("Indiquez le nom du produit.");
        return;
    }

    state.products.push({
        id: uid(),
        name,
        price,
        stock,
        createdAt: new Date().toISOString()
    });

    saveData();

    closeModal("productModal");

    renderProducts();

    showToast("Produit ajouté.");
}

function renderProducts() {

    const container =
        document.getElementById("productsList");

    if (!container) return;

    if (!hasFeature("products")) {

        container.innerHTML = `
            <div class="locked-card">

                <div>🔒</div>

                <strong>
                    Fonctionnalité PRO
                </strong>

                <p>
                    La gestion des produits est disponible
                    avec COIFF'BOOST PRO.
                </p>

                <button
                    class="primary-btn"
                    onclick="navigate('subscription')">

                    Voir les abonnements

                </button>

            </div>
        `;

        return;
    }

    if (state.products.length === 0) {

        container.innerHTML = `
            <div class="list-empty">
                Aucun produit enregistré.
            </div>
        `;

        return;
    }

    container.innerHTML =
        state.products.map(product => {

            return `
                <div class="list-item">

                    <div class="list-avatar">
                        🧴
                    </div>

                    <div class="list-content">

                        <strong>
                            ${escapeHTML(product.name)}
                        </strong>

                        <small>
                            Prix :
                            ${formatMoney(product.price)}
                        </small>

                        <small>
                            Stock :
                            ${product.stock}
                        </small>

                    </div>

                    <div class="list-actions">

                        <button
                            class="small-btn"
                            onclick="deleteProduct('${product.id}')">
                            🗑️
                        </button>

                    </div>

                </div>
            `;

        }).join("");
}

function deleteProduct(id) {

    if (!hasFeature("products")) {
        showProMessage();
        return;
    }

    if (!confirm("Supprimer ce produit ?")) {
        return;
    }

    state.products =
        state.products.filter(
            product => product.id !== id
        );

    saveData();

    renderProducts();

    showToast("Produit supprimé.");
}

/* =========================================================
   FACTURES
   ========================================================= */

function generateInvoice() {

    const client =
        valueOf("invoiceClient");

    const service =
        valueOf("invoiceService");

    const quantity =
        Number(valueOf("invoiceQuantity") || 1);

    const price =
        Number(valueOf("invoicePrice") || 0);

    const discount =
        Number(valueOf("invoiceDiscount") || 0);

    if (!client || !service) {

        showToast(
            "Indiquez la cliente et la prestation."
        );

        return;
    }

    const total =
        Math.max(
            0,
            quantity * price - discount
        );

    const number =
        generateInvoiceNumber();

    setText("invoiceNumber", number);

    setText(
        "invoiceDate",
        formatDate(getToday())
    );

    setText(
        "invoiceClientDisplay",
        client
    );

    setText(
        "invoiceServiceDisplay",
        service
    );

    setText(
        "invoiceQuantityDisplay",
        quantity
    );

    setText(
        "invoiceTotalDisplay",
        formatMoney(total)
    );

    setText(
        "invoiceFinalTotal",
        formatMoney(total)
    );

    showToast("Aperçu de facture généré.");
}

function saveInvoice() {

    const client =
        valueOf("invoiceClient");

    const service =
        valueOf("invoiceService");

    const quantity =
        Number(valueOf("invoiceQuantity") || 1);

    const price =
        Number(valueOf("invoicePrice") || 0);

    const discount =
        Number(valueOf("invoiceDiscount") || 0);

    if (!client || !service) {

        showToast(
            "Complétez la facture avant de l'enregistrer."
        );

        return;
    }

    const total =
        Math.max(
            0,
            quantity * price - discount
        );

    state.invoices.push({

        id: uid(),

        number:
            generateInvoiceNumber(),

        client,
        service,
        quantity,
        price,
        discount,
        total,

        date: getToday(),

        paid: false
    });

    saveData();

    renderInvoiceHistory();
    renderDashboard();

    showToast("Facture enregistrée.");
}

function renderInvoiceHistory() {

    const container =
        document.getElementById("invoiceHistory");

    if (!container) return;

    if (state.invoices.length === 0) {

        container.innerHTML = `
            <div class="list-empty">
                Aucune facture enregistrée.
            </div>
        `;

        return;
    }

    container.innerHTML =
        [...state.invoices]
            .reverse()
            .map(invoice => {

                return `
                    <div class="list-item">

                        <div class="list-avatar">
                            🧾
                        </div>

                        <div class="list-content">

                            <strong>
                                ${escapeHTML(invoice.number)}
                            </strong>

                            <small>
                                ${escapeHTML(invoice.client)}
                            </small>

                            <small>
                                ${escapeHTML(invoice.service)}
                                ·
                                ${formatDate(invoice.date)}
                            </small>

                        </div>

                        <div class="list-actions">

                            <span class="list-price">
                                ${formatMoney(invoice.total)}
                            </span>

                            <button
                                class="small-btn"
                                onclick="toggleInvoicePaid('${invoice.id}')">

                                ${invoice.paid ? "✓" : "€"}

                            </button>

                            <button
                                class="small-btn"
                                onclick="deleteInvoice('${invoice.id}')">

                                🗑️

                            </button>

                        </div>

                    </div>
                `;

            }).join("");
}

function toggleInvoicePaid(id) {

    const invoice =
        state.invoices.find(item => item.id === id);

    if (!invoice) return;

    invoice.paid = !invoice.paid;

    saveData();

    renderInvoiceHistory();

    showToast(
        invoice.paid
            ? "Facture payée."
            : "Facture impayée."
    );
}

function deleteInvoice(id) {

    if (!confirm("Supprimer cette facture ?")) {
        return;
    }

    state.invoices =
        state.invoices.filter(
            invoice => invoice.id !== id
        );

    saveData();

    renderInvoiceHistory();
    renderDashboard();

    showToast("Facture supprimée.");
}

function printInvoice() {

    if (!hasFeature("pdf")) {
        showProMessage();
        return;
    }

    window.print();
}

function generateInvoiceNumber() {

    const date = new Date();

    return `CB-${date.getFullYear()}${String(
        date.getMonth() + 1
    ).padStart(2, "0")}${String(
        date.getDate()
    ).padStart(2, "0")}-${String(
        state.invoices.length + 1
    ).padStart(4, "0")}`;
}

/* =========================================================
   STATISTIQUES
   ========================================================= */

function renderStatistics() {

    const locked =
        document.getElementById("statisticsLocked");

    const content =
        document.getElementById("statisticsContent");

    if (!locked || !content) return;

    if (!hasFeature("statistics")) {

        locked.classList.remove("hidden");
        content.classList.add("hidden");

        return;
    }

    locked.classList.add("hidden");
    content.classList.remove("hidden");

    const revenue =
        calculateRevenue();

    const average =
        state.invoices.length
            ? revenue / state.invoices.length
            : 0;

    setText(
        "statsRevenue",
        formatMoney(revenue)
    );

    setText(
        "statsAverage",
        formatMoney(average)
    );

    setText(
        "statsClients",
        state.clients.length
    );

    setText(
        "statsServices",
        state.services.length
    );

    const analysis =
        document.getElementById("statsAnalysis");

    if (!analysis) return;

    analysis.innerHTML = `
        <div class="analysis-row">
            <span>Meilleure cliente</span>
            <strong>
                ${
                    getBestClient()
                        ? escapeHTML(getBestClient().name)
                        : "—"
                }
            </strong>
        </div>

        <div class="analysis-row">
            <span>Prestation la plus vendue</span>
            <strong>
                ${escapeHTML(getBestService() || "—")}
            </strong>
        </div>

        <div class="analysis-row">
            <span>Factures payées</span>
            <strong>
                ${
                    state.invoices.filter(
                        invoice => invoice.paid
                    ).length
                }
            </strong>
        </div>

        <div class="analysis-row">
            <span>Factures impayées</span>
            <strong>
                ${
                    state.invoices.filter(
                        invoice => !invoice.paid
                    ).length
                }
            </strong>
        </div>
    `;
}

function getBestClient() {

    if (state.clients.length === 0) {
        return null;
    }

    return [...state.clients]
        .map(client => {

            const revenue =
                state.invoices
                    .filter(
                        invoice =>
                            invoice.client === client.name
                    )
                    .reduce(
                        (sum, invoice) =>
                            sum + Number(invoice.total || 0),
                        0
                    );

            return {
                ...client,
                revenue
            };

        })
        .sort(
            (a, b) =>
                b.revenue - a.revenue
        )[0];
}

function getBestService() {

    const counts = {};

    state.invoices.forEach(invoice => {

        const service =
            invoice.service || "Autre";

        counts[service] =
            (counts[service] || 0) +
            Number(invoice.quantity || 1);
    });

    const entries =
        Object.entries(counts);

    if (entries.length === 0) {
        return null;
    }

    entries.sort(
        (a, b) => b[1] - a[1]
    );

    return entries[0][0];
}

/* =========================================================
   ABONNEMENT
   ========================================================= */

function selectPlan(plan) {

    if (!PLANS[plan]) return;

    if (plan === "FREE") {

        state.plan = "FREE";

        if (!state.ownerUnlocked) {
            saveData();
        }

        updateSubscriptionPage();
        applyPlanRestrictions();

        showToast("Formule Gratuit activée.");

        return;
    }

    const confirmation =
        confirm(
            `Activer ${PLANS[plan].name} en mode local ?\n\nAucun paiement réel ne sera effectué.`
        );

    if (!confirmation) return;

    state.plan = plan;

    saveData();

    updateSubscriptionPage();
    applyPlanRestrictions();

    showToast(
        `${PLANS[plan].name} activé localement.`
    );
}

function updateSubscriptionPage() {

    const plan =
        PLANS[state.plan] || PLANS.FREE;

    setText(
        "currentPlan",
        plan.name
    );
}

function hasFeature(feature) {

    if (state.ownerUnlocked) {
        return true;
    }

    const plan =
        PLANS[state.plan] || PLANS.FREE;

    return Boolean(
        plan.features[feature]
    );
}

function showProMessage() {

    showToast(
        "⭐ Fonction disponible avec COIFF'BOOST PRO."
    );
}

function applyPlanRestrictions() {

    document.querySelectorAll(".pro-feature")
        .forEach(element => {

            const unlocked =
                state.ownerUnlocked ||
                hasFeature("products");

            element.classList.toggle(
                "locked",
                !unlocked
            );
        });

    renderStatistics();
    renderProducts();
}

/* =========================================================
   PARAMETRES
   ========================================================= */

function renderSettings() {

    setValue(
        "settingSalon",
        state.settings.salon
    );

    setValue(
        "settingOwner",
        state.settings.owner
    );

    setValue(
        "settingPhone",
        state.settings.phone
    );

    setValue(
        "settingAddress",
        state.settings.address
    );

    updateSalonHeader();
}

function saveSettings() {

    state.settings.salon =
        valueOf("settingSalon");

    state.settings.owner =
        valueOf("settingOwner");

    state.settings.phone =
        valueOf("settingPhone");

    state.settings.address =
        valueOf("settingAddress");

    saveData();

    updateSalonHeader();

    showToast("Paramètres enregistrés.");
}

function updateSalonHeader() {

    setText(
        "salonHeader",
        state.settings.salon ||
        "Gestion professionnelle"
    );

    setText(
        "invoiceSalon",
        state.settings.salon ||
        APP_NAME
    );

    setText(
        "invoiceOwner",
        state.settings.owner ||
        "Gestion professionnelle"
    );
}

/* =========================================================
   CODE PROPRIETAIRE
   ========================================================= */

function unlockOwner() {

    const input =
        valueOf("masterCode");

    const message =
        document.getElementById("unlockMessage");

    if (input === OWNER_CODE) {

        state.ownerUnlocked = true;
        state.plan = "PREMIUM";

        saveData();

        applyPlanRestrictions();
        updateSubscriptionPage();

        if (message) {
            message.textContent =
                "✓ Accès complet activé.";
        }

        setValue("masterCode", "");

        showToast(
            "Accès complet COIFF'BOOST activé."
        );

        return;
    }

    if (message) {
        message.textContent =
            "Code incorrect.";
    }

    showToast("Code incorrect.");
}

/* =========================================================
   EXPORT
   ========================================================= */

function exportData() {

    const blob =
        new Blob(
            [
                JSON.stringify(
                    state,
                    null,
                    2
                )
            ],
            {
                type: "application/json"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        `coiffboost-backup-${getToday()}.json`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    showToast("Sauvegarde exportée.");
}

/* =========================================================
   RESET
   ========================================================= */

function resetData() {

    const confirmation =
        prompt(
            "Tapez SUPPRIMER pour effacer toutes les données."
        );

    if (confirmation !== "SUPPRIMER") {
        return;
    }

    localStorage.removeItem(STORAGE_KEY);

    location.reload();
}

/* =========================================================
   MODALES
   ========================================================= */

function openModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) {
        console.error(`Modal introuvable : ${id}`);
        return;
    }

    modal.classList.add("active");
}

function closeModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) return;

    modal.classList.remove("active");
}

/* =========================================================
   EVENEMENTS
   ========================================================= */

function setupEvents() {

    document.querySelectorAll(".modal")
        .forEach(modal => {

            modal.addEventListener(
                "click",
                event => {

                    if (event.target === modal) {
                        modal.classList.remove("active");
                    }
                }
            );

        });

    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                document
                    .querySelectorAll(".modal.active")
                    .forEach(modal => {
                        modal.classList.remove("active");
                    });
            }
        }
    );

    const clientSearch =
        document.getElementById("clientSearch");

    if (clientSearch) {
        clientSearch.addEventListener(
            "input",
            renderClients
        );
    }
}

/* =========================================================
   UTILITAIRES
   ========================================================= */

function uid() {

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2)
    );
}

function getToday() {

    return new Date()
        .toISOString()
        .slice(0, 10);
}

function valueOf(id) {

    const element =
        document.getElementById(id);

    return element
        ? String(element.value || "").trim()
        : "";
}

function setValue(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.value = value ?? "";
    }
}

function setText(id, text) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = text ?? "";
    }
}

function clearFields(ids) {

    ids.forEach(id => {
        setValue(id, "");
    });
}

function formatMoney(value) {

    return new Intl.NumberFormat(
        "fr-FR",
        {
            style: "currency",
            currency: "EUR"
        }
    ).format(
        Number(value || 0)
    );
}

function formatDate(dateString) {

    if (!dateString) {
        return "—";
    }

    const date =
        new Date(
            `${dateString}T12:00:00`
        );

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString(
        "fr-FR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}

function sortAppointments(a, b) {

    const dateA =
        new Date(
            `${a.date}T${a.time || "00:00"}`
        );

    const dateB =
        new Date(
            `${b.date}T${b.time || "00:00"}`
        );

    return dateA - dateB;
}

function countTodayAppointments() {

    const today =
        getToday();

    return state.appointments
        .filter(
            appointment =>
                appointment.date === today
        )
        .length;
}

function calculateRevenue() {

    return state.invoices.reduce(
        (total, invoice) =>
            total +
            Number(invoice.total || 0),
        0
    );
}

function initials(name) {

    if (!name) {
        return "?";
    }

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(
            word =>
                word.charAt(0).toUpperCase()
        )
        .join("");
}

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   TOAST
   ========================================================= */

let toastTimer = null;

function showToast(message) {

    const toast =
        document.getElementById("toast");

    if (!toast) {
        console.log(message);
        return;
    }

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 2600);
}

/* =========================================================
   DEBUG
   ========================================================= */

window.COIFFBOOST = {
    state,
    navigate,
    saveData,
    renderAll,
    calculatePrice,
    generateInvoice,
    unlockOwner
};

console.log(
    `${APP_NAME} V${APP_VERSION} chargé correctement.`
);